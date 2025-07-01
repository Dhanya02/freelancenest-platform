from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from pymongo import MongoClient
from bson import ObjectId
import datetime
import os, json
from dotenv import load_dotenv

load_dotenv()

class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        return json.JSONEncoder.default(self, o)

app = FastAPI()
app.json_encoder = JSONEncoder
# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Atlas Connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)
db = client.freelance

# Helper to convert ObjectId to string
def convert_id(document):
    if document and "_id" in document:
        document["_id"] = str(document["_id"])
    return document

# Pydantic models
class AddEmailModel(BaseModel):
    email: str

class ProjectManagerModel(BaseModel):
    email: str

class ProjectModel(BaseModel):
    userEmail: str
    projectName: str
    problemStatement: str
    description: str
    technologies: Optional[List[str]] = []
    level: str
    duration: str
    money: str
    projectType: str = "code"  # Default to code projects

class UpdateProjectModel(BaseModel):
    question: str

# Add to existing FeedbackModel class
class FeedbackModel(BaseModel):
    grade: int
    justification: str
    user_feedback: str
    status: Optional[str] = "pending"

def convert_nested_objectids(doc):
    """Recursively convert all ObjectIds to strings in a document"""
    if isinstance(doc, dict):
        return {k: convert_nested_objectids(v) for k, v in doc.items()}
    elif isinstance(doc, list):
        return [convert_nested_objectids(v) for v in doc]
    elif isinstance(doc, ObjectId):
        return str(doc)
    return doc


# FREELANCER ENDPOINTS
@app.get("/freelancer/developers/{email}/projects", response_model=List[dict])
async def get_developer_projects(email: str):
    try:
        project_devs = list(db.projectsDeveloper.find({"developerEmail": email}))
        if not project_devs:
            return []
            
        project_ids = [pd["projectId"] for pd in project_devs]
        object_ids = [ObjectId(pid) if not isinstance(pid, ObjectId) else pid for pid in project_ids]
        projects = list(db.projects.find({"_id": {"$in": object_ids}}))
        
        return [convert_nested_objectids(p) for p in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/freelancer/projects/{projectId}/add-email", status_code=status.HTTP_201_CREATED)
async def add_project_email(projectId: str, payload: AddEmailModel):
    try:
        # Verify project exists
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        # Check if developer is already assigned
        existing = db.projectsDeveloper.find_one({
            "projectId": ObjectId(projectId),
            "developerEmail": payload.email
        })
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Developer is already assigned to this project"
            )

        project_developer = {
            "projectId": ObjectId(projectId),
            "developerEmail": payload.email
        }
        result = db.projectsDeveloper.insert_one(project_developer)
        return convert_nested_objectids({
            "_id": result.inserted_id,
            **project_developer
        })
    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        raise HTTPException(status_code=500, detail=str(e))

# PROJECT ENDPOINTS

@app.post("/PM/users", status_code=status.HTTP_201_CREATED)
def add_project_manager(payload: ProjectManagerModel):
    email = payload.email
    existing_manager = db.projectmanagers.find_one({"email": email})
    if existing_manager:
        return {"message": "Project manager already exists"}
    new_manager = {"email": email, "projects": []}
    result = db.projectmanagers.insert_one(new_manager)
    new_manager["_id"] = str(result.inserted_id)
    return new_manager

@app.post("/PM/projects", status_code=status.HTTP_201_CREATED)
def add_project(payload: ProjectModel):
    manager = db.projectmanagers.find_one({"email": payload.userEmail})
    if not manager:
        raise HTTPException(status_code=400, detail="Project manager not found")
    new_project = {
        "projectName": payload.projectName,
        "problemStatement": payload.problemStatement,
        "description": payload.description,
        "technologies": payload.technologies,
        "level": payload.level,
        "duration": payload.duration,
        "money": payload.money,
        "question": "",
        "projectType": payload.projectType,  # Store the project type
        "feedback": []
    }
    result = db.projects.insert_one(new_project)
    new_project["_id"] = result.inserted_id
    db.projectmanagers.update_one(
        {"email": payload.userEmail},
        {"$push": {"projects": new_project["_id"]}}
    )
    new_project["_id"] = str(new_project["_id"])
    return new_project

@app.get("/PM/projects", response_model=List[dict])
async def get_all_projects():
    try:
        projects = list(db.projects.find())
        return [convert_nested_objectids(p) for p in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/PM/projects/{userEmail}", response_model=List[dict])
async def get_projects_by_user(userEmail: str):
    try:
        manager = db.projectmanagers.find_one({"email": userEmail})
        if not manager:
            return []
            
        project_ids = manager.get("projects", [])
        object_ids = [ObjectId(pid) if not isinstance(pid, ObjectId) else pid for pid in project_ids]
        projects = list(db.projects.find({"_id": {"$in": object_ids}}))
        
        return [convert_nested_objectids(p) for p in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/PM/projects/{projectId}")
async def update_project(projectId: str, payload: UpdateProjectModel):
    try:
        result = db.projects.update_one(
            {"_id": ObjectId(projectId)},
            {"$set": {"question": payload.question}}
        )
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
            
        updated_project = db.projects.find_one({"_id": ObjectId(projectId)})
        return convert_nested_objectids(updated_project)
    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        raise HTTPException(status_code=500, detail=str(e))
    

@app.get("/PM/projects/questions/{projectId}")
def get_project_question(projectId: str):
    project = db.projects.find_one({"_id": ObjectId(projectId)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"question": project.get("question", "")}

# @app.get("/PM/allprojects", response_model=List[dict])
# def get_all_projects_alias():
#     try:
#         # Get all projects and convert ObjectIds to strings
#         projects = list(db.projects.find())
#         serialized_projects = []
        
#         for project in projects:
#             # Convert ObjectId to string for the main document ID
#             project['_id'] = str(project['_id'])
            
#             # Handle any nested ObjectIds in the project document
#             if 'feedback' in project:
#                 for feedback in project['feedback']:
#                     if '_id' in feedback and isinstance(feedback['_id'], ObjectId):
#                         feedback['_id'] = str(feedback['_id'])
            
#             serialized_projects.append(project)
            
#         return serialized_projects
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

@app.get("/PM/allprojects", response_model=List[dict])
async def get_all_projects_alias(email: Optional[str] = None):
    try:
        # First get all projects
        projects = list(db.projects.find())
        print("Email: ", email)
        if email:
            # Find if the user is a project manager
            manager = db.projectmanagers.find_one({"email": email})
            if manager:
                # Get IDs of projects created by this manager
                manager_project_ids = set(str(pid) for pid in manager.get("projects", []))
                # Filter out projects created by this manager
                projects = [
                    project for project in projects 
                    if str(project["_id"]) not in manager_project_ids
                ]
                
            applied_projects = db.projectsDeveloper.find({"developerEmail": email})
            applied_project_ids = set(str(proj["projectId"]) for proj in applied_projects)
            
            # Filter out projects the developer has already applied to
            projects = [
                project for project in projects
                if str(project["_id"]) not in applied_project_ids
            ]
        
        # Convert all ObjectIds to strings in the remaining projects
        serialized_projects = []
        for project in projects:
            # Convert ObjectId to string for the main document ID
            project['_id'] = str(project['_id'])
            
            # Handle any nested ObjectIds in the project document
            if 'feedback' in project:
                for feedback in project['feedback']:
                    if '_id' in feedback and isinstance(feedback['_id'], ObjectId):
                        feedback['_id'] = str(feedback['_id'])
            
            serialized_projects.append(project)
            
        return serialized_projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/PM/projects/{projectId}/feedback/{email}")
async def add_project_feedback(projectId: str, email: str, payload: FeedbackModel):
    try:
        feedback_entry = {
            "userId": email,
            "grade": payload.grade,
            "justification": payload.justification,
            "user_feedback": payload.user_feedback,
        }
        
        result = db.projects.update_one(
            {"_id": ObjectId(projectId)},
            {"$push": {"feedback": feedback_entry}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
            
        updated_project = db.projects.find_one({"_id": ObjectId(projectId)})
        return convert_nested_objectids(updated_project)
    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/PM/projects/{projectId}/feedback", response_model=List[dict])
async def get_project_feedback(projectId: str):
    try:
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
            
        feedbacks = project.get("feedback", [])
        return [convert_nested_objectids(f) for f in feedbacks]
    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/freelancer/developers")
async def add_developer(developer: Dict):
    try:
        email = developer.get("email")
        
        # Check for existing developer
        existing_developer = db.developers.find_one({"email": email})
        if not existing_developer:
            # Create new developer
            new_developer = {"email": email}
            result = db.developers.insert_one(new_developer)
            new_developer["_id"] = str(result.inserted_id)
            return new_developer
        else:
            # Convert ObjectId to string
            existing_developer["_id"] = str(existing_developer["_id"])
            return existing_developer
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ...existing code...

@app.post("/freelancer/projects/{projectId}/submit", status_code=status.HTTP_201_CREATED)
async def submit_project(projectId: str, submission: dict):
    try:
        # Validate project exists
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Check required fields
        developer_email = submission.get("developerEmail")
        github_link = submission.get("githubLink")

        if not all([developer_email, github_link]):
            print("Missing required fields")
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Check for existing submission
        # existing = db.submittedProjects.find_one({
        #     "projectId": ObjectId(projectId),
        #     "developerEmail": developer_email
        # })
        # if existing:
        #     print("Project already submitted")
        #     raise HTTPException(status_code=400, detail="Project already submitted")

        # Create submission record
        submission_data = {
            "projectId": ObjectId(projectId),
            "developerEmail": developer_email,
            "githubLink": github_link,
            "youtubeLink": '',
        }
        
        result = db.submittedProjects.insert_one(submission_data)
        submission_data["_id"] = str(result.inserted_id)
        submission_data["projectId"] = str(submission_data["projectId"])
        
        return submission_data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/freelancer/projects/{projectId}/submit-blog", status_code=status.HTTP_201_CREATED)
async def submit_blog(projectId: str, submission: dict):
    try:
        # Validate project exists
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Verify this is a content project
        if project.get("projectType") != "content":
            raise HTTPException(status_code=400, detail="This project requires code submission, not blog content")

        # Check required fields
        developer_email = submission.get("developerEmail")
        blog_url = submission.get("blogUrl")

        if not all([developer_email, blog_url]):
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Create submission record
        submission_data = {
            "projectId": ObjectId(projectId),
            "developerEmail": developer_email,
            "blogUrl": blog_url,
            "submissionType": "blog"
        }
        
        result = db.submittedProjects.insert_one(submission_data)
        submission_data["_id"] = str(result.inserted_id)
        submission_data["projectId"] = str(submission_data["projectId"])
        
        return submission_data

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/freelancer/leaderboard")
async def get_leaderboard():
    try:
        # Get all submitted projects with developer info
        submissions = list(db.submittedProjects.find())
        
        # Create developer stats dictionary
        developer_stats = {}
        
        for submission in submissions:
            developer_email = submission["developerEmail"]
            project_id = submission["projectId"]
            
            # Get project feedback
            project = db.projects.find_one({"_id": project_id})
            if project and "feedback" in project:
                if developer_email not in developer_stats:
                    developer_stats[developer_email] = {
                        "email": developer_email,
                        "total_projects": 0,
                        "total_grade": 0,
                        "average_grade": 0,
                        "total_feedback": 0
                    }
                
                stats = developer_stats[developer_email]
                stats["total_projects"] += 1
                
                # Calculate grades from feedback
                for feedback in project["feedback"]:
                    stats["total_grade"] += feedback["grade"]
                    stats["total_feedback"] += 1
        
        # Calculate averages and prepare leaderboard
        leaderboard = []
        for stats in developer_stats.values():
            if stats["total_feedback"] > 0:
                stats["average_grade"] = round(stats["total_grade"] / stats["total_feedback"], 2)
            leaderboard.append(stats)
        
        # Sort by average grade (descending)
        leaderboard.sort(key=lambda x: x["average_grade"], reverse=True)
        
        # Add rank to each entry
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
            
        return leaderboard

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.delete("/PM/projects/{projectId}")
async def delete_project(projectId: str):
    try:
        # First, get the project to find the associated project manager
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Delete the project from projects collection
        result = db.projects.delete_one({"_id": ObjectId(projectId)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")

        # Remove project reference from project managers
        db.projectmanagers.update_many(
            {},
            {"$pull": {"projects": ObjectId(projectId)}}
        )

        # Delete any associated project-developer relationships
        db.projectsDeveloper.delete_many({"projectId": ObjectId(projectId)})

        # Delete any submitted projects
        db.submittedProjects.delete_many({"projectId": ObjectId(projectId)})

        return {"message": "Project successfully deleted"}

    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        raise HTTPException(status_code=500, detail=str(e))
    
# Add this Pydantic model with the other models
class DeveloperUpdateModel(BaseModel):
    firstName: str
    lastName: str
    linkedin: str
    github: str
    techStack: List[str]

# Add this endpoint with the other developer endpoints
@app.post("/freelancer/developers/{email}", status_code=status.HTTP_200_OK)
async def update_developer(email: str, payload: DeveloperUpdateModel):
    try:
        # Check if developer exists
        developer = db.developers.find_one({"email": email})
        if not developer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Developer not found"
            )
        
        # Update developer fields
        update_data = {
            "firstName": payload.firstName,
            "lastName": payload.lastName,
            "linkedin": payload.linkedin,
            "github": payload.github,
            "techStack": payload.techStack
        }
        
        result = db.developers.update_one(
            {"email": email},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Update failed"
            )
            
        # Get and return updated developer
        updated_developer = db.developers.find_one({"email": email})
        return convert_nested_objectids(updated_developer)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
@app.get("/freelancer/projects/{projectId}/developers", response_model=List[str])
async def get_project_developers(projectId: str):
    try:
        # Verify project exists
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Project not found"
            )

        # Find all developers associated with the project
        project_developers = list(db.projectsDeveloper.find({"projectId": ObjectId(projectId)}))
        
        # Extract developer emails
        developer_emails = [pd["developerEmail"] for pd in project_developers]
        
        return developer_emails

    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project ID format"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    


# Add new endpoint to update feedback status
# @app.put("/PM/projects/{projectId}/feedback/{email}/status")
# async def update_feedback_status(projectId: str, email: str, status: str):
#     try:
#         result = db.projects.update_one(
#             {
#                 "_id": ObjectId(projectId),
#                 "feedback.userId": email
#             },
#             {"$set": {"feedback.$.status": status}}
#         )
        
#         if result.modified_count == 0:
#             raise HTTPException(status_code=404, detail="Feedback not found")
            
#         updated_project = db.projects.find_one({"_id": ObjectId(projectId)})
#         return convert_nested_objectids(updated_project)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    

class StatusUpdateModel(BaseModel):
    status: str

@app.put("/PM/projects/{projectId}/feedback/{email}/status")
async def update_feedback_status(projectId: str, email: str, status_update: StatusUpdateModel):
    try:
        result = db.projects.update_one(
            {
                "_id": ObjectId(projectId),
                "feedback.userId": email
            },
            {"$set": {"feedback.$.status": status_update.status}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Feedback not found")
            
        updated_project = db.projects.find_one({"_id": ObjectId(projectId)})
        return convert_nested_objectids(updated_project)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
# Add this Pydantic model with the other models
class InterviewFeedbackModel(BaseModel):
    feedback: str
    grade: int

@app.post("/PM/projects/{projectId}/interview-feedback/{developerEmail}")
async def submit_interview_feedback(projectId: str, developerEmail: str, payload: InterviewFeedbackModel):
    try:
        # Verify project exists
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Create interview feedback entry
        interview_feedback = {
            "feedback": payload.feedback,
            "grade": payload.grade,
            "timestamp": datetime.datetime.now()
        }
        
        # Add interview feedback to project
        result = db.projects.update_one(
            {"_id": ObjectId(projectId)},
            {"$push": {"interview_feedback": {
                "developer_email": developerEmail,
                **interview_feedback
            }}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail="Failed to add interview feedback")
            
        return {
            "success": True,
            "message": "Interview feedback submitted successfully"
        }
        
    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/PM/projects/{projectId}/interview-feedback/{developerEmail}")
async def get_interview_feedback(projectId: str, developerEmail: str):
    try:
        # Verify project exists
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Find interview feedback for this developer
        feedback_list = []
        if "interview_feedback" in project:
            feedback_list = [
                feedback for feedback in project["interview_feedback"]
                if feedback.get("developer_email") == developerEmail
            ]
            
        return convert_nested_objectids(feedback_list)
        
    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/freelancer/projects/{projectId}")
async def get_project_details(projectId: str):
    try:
        # Verify project exists and convert ObjectId
        project = db.projects.find_one({"_id": ObjectId(projectId)})
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Project not found"
            )

        # Return converted project
        return convert_nested_objectids(project)

    except Exception as e:
        if "Invalid ObjectId" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project ID format"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    
# Add this to app.py
@app.put("/PM/projects/{projectId}/interview-feedback/{developerEmail}/status")
async def update_interview_feedback_status(projectId: str, developerEmail: str, status_update: StatusUpdateModel):
    try:
        result = db.projects.update_one(
            {
                "_id": ObjectId(projectId),
                "interview_feedback.developer_email": developerEmail
            },
            {"$set": {"interview_feedback.$.status": status_update.status}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Interview feedback not found")
            
        updated_project = db.projects.find_one({"_id": ObjectId(projectId)})
        return convert_nested_objectids(updated_project)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))