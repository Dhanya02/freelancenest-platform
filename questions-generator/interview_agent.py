import os
from pathlib import Path
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from prompts.interview_agent_prompt import prompt, completed_propmt
from langgraph.graph import StateGraph, END
from pydantic import BaseModel, Field
from typing import List
from typing_extensions import TypedDict
from dotenv import load_dotenv
from langchain_community.chat_message_histories.upstash_redis import UpstashRedisChatMessageHistory
from langgraph.types import Command

load_dotenv()

class InterviewResponse(BaseModel):
    is_interview_over: bool = Field(description="Whether the interview is over or not.")
    response: str = Field(description="The response message to be sent to the user.")

class InterviewCompletion(BaseModel):
    interview_over: bool = Field(description="Whether the interview is over or not.")

class InterviewAgent:
    def __init__(self):
        self.interview_agent_prompt = prompt
        self.llm = ChatOpenAI(
            model_name='gpt-4o',
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.1
        )
        self.llm_2 = ChatOpenAI(
            model_name='gpt-4o-mini',
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.1
        )
        self.completed_or_not_prompt = ChatPromptTemplate.from_messages([
            ("system", completed_propmt),
            MessagesPlaceholder(variable_name="chat_history")
        ])
        # self.llm = ChatOpenAI(
        #     model='deepseek-chat', 
        #     api_key= os.getenv("DEEPSAKE_API_KEY"),
        #     base_url='https://api.deepseek.com',
        #     max_tokens=4096
        # )

    async def run_agent(self, query: str, project_id: str, developer_email: str, project_name: str, project_description: str, technologies: str, project_duration: str):
        history = UpstashRedisChatMessageHistory(
            url=os.getenv("UPSTASH_REDIS_REST_URL"),
            token=os.getenv("UPSTASH_REDIS_REST_TOKEN"),
            session_id=project_id
        )
        history.add_user_message(query)
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.interview_agent_prompt),
            MessagesPlaceholder(variable_name="chat_history")
        ])

        @tool
        async def submit_interview_feedback(feedback: str, grade: int):
            """
            Tool to submit the interview feedback and grade to the database.
            
            Args:
            feedback (str): The feedback for the candidate.
            grade (int): The grade for the candidate (between 0-10). 
            
            Returns:
            Dict containing success status and message.
            """
            import requests
            
            # Validate input
            if not feedback or not isinstance(feedback, str):
                return {"success": False, "message": "Feedback must be a non-empty string"}
            
            if not isinstance(grade, int) or grade < 0 or grade > 10:
                return {"success": False, "message": "Grade must be an integer between 0 and 10"}
            
            if not project_id or not developer_email:
                return {"success": False, "message": "Project ID, developer email, and interviewer email are required"}
            
            try:
                # API endpoint for submitting interview feedback
                api_url = f"http://localhost:3000/PM/projects/{project_id}/interview-feedback/{developer_email}"
                
                # Prepare payload for API request
                payload = {
                    "feedback": feedback,
                    "grade": grade,
                }
                
                # Make POST request to API endpoint
                response = requests.post(api_url, json=payload)
                
                # Check response status
                if response.status_code == 200 or response.status_code == 201:
                    return {"success": True, "message": "Interview feedback submitted successfully"}
                else:
                    return {
                        "success": False, 
                        "message": f"Failed to submit feedback. Status code: {response.status_code}",
                        "details": response.json() if response.text else "No details available"
                    }
                    
            except Exception as e:
                return {"success": False, "message": f"Error submitting feedback: {str(e)}"}

        tools = [submit_interview_feedback]
        # llm_with_tools = self.llm.bind_tools(tools)
        interview_agent = prompt | self.llm.bind_tools(tools)

        class GraphState(TypedDict):
            question: str
            answer: str
            file_name: str
            is_interview_over: bool
       

        async def generate(state):
            print("Generating response")
            response = await interview_agent.ainvoke({
                "chat_history": history.messages,
                "project_name": project_name,
                "project_description": project_description,
                "technologies": technologies,
                "project_duration": project_duration,
            })
            history.add_ai_message(response)
            return {
                "question": state["question"],
                "answer": response,
                "is_interview_over": state.get("is_interview_over", False),
            }
        
        async def is_tool_call(state):
            response = state.get("answer")
            if response.tool_calls:
                return "call_tool"
            else:
                return "continue_away"
            
        async def call_tool(state):
            print("Calling tool")
            response = state.get("answer")

            tool_names = {tool.name: tool for tool in tools}

            for tool_call in response.tool_calls:
                current_tool = tool_names[tool_call["name"].lower()]
                tool_response = await current_tool.ainvoke(tool_call)

                history.add_message(tool_response)
            
            return {
                "question": state["question"],
                "answer": response,
                "chat_history": history.messages,
                "is_interview_over": state.get("is_interview_over", False),
            }
        
        async def continue_away(state):
            return {
                "question": state["question"],
                "answer": state["answer"],
                "chat_history": history.messages,
                "is_interview_over": state.get("is_interview_over", False),
            }

        async def is_interview_complete(state):
            completer_agent = self.completed_or_not_prompt | self.llm_2.with_structured_output(InterviewCompletion)

            response = await completer_agent.ainvoke({
                "chat_history": history.messages,
            })
            response = response.interview_over
            print("Is interview over?", response)
            if response:
                update = {
                    "is_interview_over": True,
                    "answer": state["answer"],
                }
                return Command(goto=END, update=update)
            else:
                update = {
                    "is_interview_over": False,
                    "answer": state["answer"],
                }
                return Command(goto=END, update=update)

        workflow = StateGraph(GraphState)
        workflow.add_node("generate", generate)
        workflow.add_node("call_tool", call_tool)
        workflow.add_node("continue_away", continue_away)
        workflow.add_node("is_interview_complete", is_interview_complete)
        workflow.set_entry_point("generate")
        workflow.add_conditional_edges("generate", is_tool_call)
        workflow.add_edge("call_tool", "generate")
        workflow.add_edge("continue_away", "is_interview_complete")
        # workflow.add_edge("generate", END)

        app = workflow.compile()
        result = await app.ainvoke({
            "question": query,
            "project_id": project_id,
            "developer_email": developer_email,
            "project_name": project_name,
            "project_description": project_description,
            "technologies": technologies,
            "project_duration": project_duration,
        })

        return {"answer": result["answer"], "is_interview_over": result["is_interview_over"]}
