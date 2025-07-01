from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from pydantic.networks import HttpUrl
from langchain_openai import ChatOpenAI
import openai
import os
import json
from langchain_core.prompts import ChatPromptTemplate
import shutil
from dotenv import load_dotenv
import asyncio, os, shutil, stat
from contextlib import asynccontextmanager
from langchain_text_splitters import RecursiveCharacterTextSplitter
import tempfile
import stat
from file_processing import clone_github_repo, load_and_index_files
from blog_analyzer import fetch_blog_content, analyze_blog_content
from interview_agent import InterviewAgent

load_dotenv()
# Create FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

# model = ChatOpenAI(
#     model="deepseek-chat",
#     temperature=0.7,
#     base_url='https://api.deepseek.com',
#     max_completion_tokens=4096,
#     api_key=os.getenv('DEEPSAKE_API_KEY'),
# )

model = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.7,
    api_key=os.getenv('OPENAI_API_KEY'),
)

# Request model
class ProjectData(BaseModel):
    projectName: str
    problemStatement: str
    description: str
    technologies: List[str]
    level: str
    duration: str
    money: str
    projectType: str = "code"  # Default to code projects

class SubmissionData(BaseModel):
    problem_statement: str
    github_url: str

class Questions(BaseModel):
    questions: str = Field(description="JSON code containing the questions enclosed in triple single quotes")

# class GitHubResponse(BaseModel):
#     result : str = Field(description="JSON code containing the grade and justification enclosed in triple single quotes")

class GitHubResponse(BaseModel):
    grade: float = Field(description="Grade for the submission")
    justification: str = Field(description="Justification for the grade")
    feedback: str = Field(description="Feedback for the user")

@app.post("/generate-problems")
async def generate_response(data: ProjectData):
    # Check project type and adjust prompt accordingly
    if data.projectType == "content":
        prompt = """
        You will be given the project and its description by the employer.
        This is a CONTENT WRITING project. 
        Your task is to Generate 3 test questions to test the participants' content writing skills 
        similar to the project which evaluates all the required skills and capabilities to complete the project.
        The questions should ask participants to write blog posts or articles on specific topics. 
        Users should submit a blog URL or content for evaluation.

        Give the result as the json code enclosed in triple single quotes.    
        The output should be in the following format:
        '''
            {{
                "question-1" : "question",
                "question-2" : "question",
                "question-3" : "question"
            }}
        '''
        Don't include any other text other than the list. The output should be in javascript format
        """
    else:
        # Original prompt for code projects
        prompt = """
        You will be given the project and its description by the employer. 
        Your task is to Generate 3 test questions to test the participants similar to the project which evaluates all the required skills and capabilities to complete the project. Note that the questions should be tasks which has to be actually code implemented and not theoretical questions. Users should upload github link of the code implemented to evaluate the participant.

        Give the result as the json code enclosed in triple single quotes.    
        The output should be in the following format:
        '''
            {{
                "question-1" : "question",
                "question-2" : "question",
                "question-3" : "question"
            }}
        '''
        Don't include any other text other than the list. The output should be in javascript format
        """

    model_prompt = ChatPromptTemplate.from_messages(
    [
        ("system", prompt),
        ("human", " Project Name: {projectName}, Problem Statement: {problemStatement},Description: {description},Technologies: {technologies},Level: {level},Duration: {duration},Money: {money}, Project Type: {projectType}")
    ]    
    )
    # client = model_prompt | model.with_structured_output(Questions)
    client = model_prompt | model
    print(data)
    response = client.invoke({
        "projectName": data.projectName,
        "problemStatement": data.problemStatement,
        "description": data.description,
        "technologies": data.technologies,
        "level": data.level,
        "duration": data.duration,
        "money": data.money,
        "projectType": data.projectType
    })
    questions = response.content
    print("Questions: ", questions)
    content = questions.strip().strip("'")
                # Find the last valid JSON block
    json_blocks = [block for block in content.split("'''") if block.strip()]
    if json_blocks:
        content = json_blocks[-1].strip()
    content_data = json.loads(content)

    
    return {"response": content_data}


def chunk_text(text: str, max_tokens: int = 6000) -> list:
    """Split text into chunks using the RecursiveCharacterTextSplitter.
       You may adjust `max_tokens` based on your model's context limit.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=max_tokens,
        chunk_overlap=200,
        length_function=lambda txt: len(txt.split())
    )
    return text_splitter.split_text(text)

# Helper: Remove read-only files during cleanup.
async def remove_readonly_handler(func, path, exc_info):
    os.chmod(path, stat.S_IWRITE)
    try:
        func(path)
    except Exception as e:
        await asyncio.sleep(0.1)
        try:
            func(path)
        except Exception as final_e:
            print(f"Failed to remove {path}: {final_e}")

# Async context manager for temporary repository cloning.
from contextlib import asynccontextmanager
@asynccontextmanager
async def temporary_repository(github_url: str):
    repo_name = github_url.rstrip("/").split("/")[-1]
    temp_dir = tempfile.mkdtemp(prefix="repo_")
    local_path = os.path.join(temp_dir, repo_name)
    try:
        yield local_path
    finally:
        if os.path.exists(temp_dir):
            for retry in range(3):
                try:
                    shutil.rmtree(
                        temp_dir,
                        onerror=lambda f, p, e: asyncio.create_task(
                            remove_readonly_handler(f, p, e)
                        )
                    )
                    break
                except Exception as e:
                    if retry == 2:
                        print(f"Failed to cleanup repository after 3 attempts: {e}")
                    await asyncio.sleep(0.5 * (retry + 1))

# Asynchronous function to evaluate a single chunk.
async def evaluate_chunk(chunk: str, chunk_index: int, total_chunks: int, problem_statement: str) -> GitHubResponse:
    """
    Evaluate a chunk of code asynchronously. We use double curly braces to escape literal braces
    in the prompt template.
    """
    prompt = """
        You are an expert code evaluator. Review the following task and the provided implementation excerpt.
        Task Description: {problem_statement}

        Below is part {chunk_index} of {total_chunks} of the participant's code implementation.
        Evaluate this part based on:
        - Code completeness
        - Code quality
        - Best practices
        - Efficiency
        - Documentation

        You have to provide 2 things:
        1. A grade between 1-10 - based on the evaluation criteria.
        2. A detailed justification for the grade for the project owner to understand your evaluation and decide on the participant's progress.
        3. Your feedback to the user on how to improve the code and get a better grade.

        Code Excerpt:
        {chunk}
    """
    # Create a prompt template. Note the doubled curly braces for literal { and }.
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", prompt)
           
    ])
    try:
        # Merge the structured output expectation.
        client = prompt_template | model.with_structured_output(GitHubResponse)
        # We use asyncio.to_thread to run the (possibly blocking) model call in a thread.
        result = await asyncio.to_thread(client.invoke, {"problem_statement": problem_statement, "chunk": chunk, "chunk_index": chunk_index, "total_chunks": total_chunks})
        print(result)
        return result
    except Exception as e:
        print(f"Error evaluating chunk {chunk_index}: {e}")
        return None

@app.post("/analyse-submission")
async def analyse_submission(data: SubmissionData):
    if not data.github_url:
        raise HTTPException(status_code=400, detail="GitHub URL is required")
    
    async with temporary_repository(data.github_url) as local_path:
        # Clone repository
        if not clone_github_repo(data.github_url, local_path):
            raise HTTPException(
                status_code=400,
                detail="Failed to clone the repository. Please verify the URL and try again."
            )
        try:
            # Load and index files
            index, documents, _, _ = load_and_index_files(local_path)
            if not documents:
                raise HTTPException(status_code=400, detail="No documents were loaded from the repository.")
            # Concatenate all document contents
            all_documents = " ".join(doc.page_content for doc in documents)
            
            # Split into manageable chunks
            chunks = chunk_text(all_documents, max_tokens=20000)
            if not chunks:
                raise HTTPException(status_code=400, detail="No content available for evaluation after chunking.")
            
            total_chunks = len(chunks)
            # Create asynchronous tasks for each chunk evaluation
            tasks = [
                evaluate_chunk(chunk, i + 1, total_chunks, data.problem_statement)
                for i, chunk in enumerate(chunks)
            ]
            # Run evaluations concurrently
            results = await asyncio.gather(*tasks)
            # Filter out any failed evaluations
            results = [res for res in results if res is not None]
            if not results:
                raise HTTPException(status_code=500, detail="Evaluation failed for all code chunks.")
            
            # Aggregate grades and justifications
            final_grade = sum(res.grade for res in results) / len(results)
            combined_justification = "\n".join(res.justification for res in results)
            combined_feedback = "\n".join(res.feedback for res in results)
            
            content_data = {
                "grade": final_grade,
                "justification": combined_justification,
                "user_feedback": combined_feedback
            }
            return {"response": content_data}
        
        except Exception as e:
            print(f"Error processing submission: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing submission: {e}")

@app.post("/transcribe-audio")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Endpoint to transcribe audio files using OpenAI's transcription API.
    Accepts an audio file upload and returns the transcription text.
    """
    try:
        # Check file extension
        filename = file.filename
        file_extension = os.path.splitext(filename)[1].lower()

        print(f"Received audio file: {filename} ({file_extension})")
        
        # List of supported audio extensions by OpenAI
        supported_formats = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm']
        
        if file_extension not in supported_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Please upload one of these formats: {', '.join(supported_formats)}"
            )

        # Create a temporary file with the original extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            # Write the uploaded file content to the temporary file
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        print(f"Transcribing audio file: {temp_path}")
        
        # Open the temporary file and send it to OpenAI for transcription
        with open(temp_path, "rb") as audio_file:
            transcript = openai.audio.transcriptions.create(
                model="gpt-4o-mini-transcribe",
                file=audio_file
            )
        
        # Clean up the temporary file
        os.unlink(temp_path)
        
        # Return the transcription result
        return {"transcription": transcript.text}
    
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        # Clean up in case of error
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.unlink(temp_path)
        
        print(f"Transcription error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error transcribing audio: {str(e)}"
        )
    
class Query(BaseModel):
    query: str
    project_id: str
    developer_email: str
    project_name: str
    project_description: str
    technologies: str
    project_duration: str

    
@app.post("/ask-question")
async def ask_question(query: Query):
    

    # try:
    # Get or create agent for this session
    agent = InterviewAgent()
    
    
    
    # Now run the agent
    response_future = asyncio.create_task(agent.run_agent(query.query, query.project_id, query.developer_email, query.project_name, query.project_description, query.technologies, query.project_duration))
    
    try:
        response = await response_future
    except asyncio.CancelledError:
        # Handle cancellation gracefully
        return {
            "answer": "Extension generation was stopped by user request.",
            "download_token": None,
            "success": False
        }
    
    
    success = bool(response.get('answer'))
    answer = response.get('answer').content
    print("Success:", success)
    if success:
        return {
            "answer": answer,
            "success": success,
            "is_interview_over": response.get('is_interview_over', False),
        }
    else:
        return {
            "answer": response.get('error', "An error occurred during extension generation"),
            "download_token": None,
            "success": success
        }
    # except Exception as e:
    #     print(f"Error in make_extension: {e}")
    #     return {
    #         "answer": f"An error occurred: {str(e)}",
    #         "download_token": None,
    #         "success": False
    #     }   

# Add these new models
class BlogUrlData(BaseModel):
    url: HttpUrl
    


# Add these new endpoints

@app.post("/analyse-blog-url")
async def analyse_blog_from_url(data: BlogUrlData):
    """Analyze content quality from a blog URL"""
    try:
        # Fetch content
        content = await fetch_blog_content(str(data.url))
        if not content:
            raise HTTPException(
                status_code=400,
                detail="Failed to extract content from the provided URL"
            )
        
        # Analyze content
        analysis = await analyze_blog_content(content)
        
        return {
            "response": {
                "overall_score": analysis.overall_score,
                "clarity_score": analysis.clarity_score,
                "engagement_score": analysis.engagement_score, 
                "structure_score": analysis.structure_score,
                "seo_score": analysis.seo_score,
                "writing_style": analysis.writing_style_assessment,
                "strengths": analysis.strengths,
                "weaknesses": analysis.weaknesses,
                "improvement_suggestions": analysis.improvement_suggestions
            }
        }
    
    except Exception as e:
        print(f"Error analyzing blog: {e}")
        raise HTTPException(status_code=500, detail=f"Error analyzing blog: {str(e)}")
