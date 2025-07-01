import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/authContext';
import Select from 'react-select';
import axios from 'axios';
import Navbar from '../Navbar';
import { FallingLines } from 'react-loader-spinner';

const Dashboard = () => {
  const techOptions = [
    { value: 'React', label: 'React' },
    { value: 'Node.js', label: 'Node.js' },
    { value: 'JavaScript', label: 'JavaScript' },
    { value: 'Python', label: 'Python' },
    { value: 'Java', label: 'Java' },
    { value: 'Ruby', label: 'Ruby' },
    { value: 'Swift', label: 'Swift' },
    { value: 'HTML/CSS', label: 'HTML/CSS' },
    { value: 'SQL', label: 'SQL' },
    { value: 'MongoDB', label: 'MongoDB' },
    { value: 'Firebase', label: 'Firebase' },
    { value: 'AWS', label: 'AWS' },
    { value: 'Azure', label: 'Azure' },
    { value: 'GCP', label: 'GCP' },
    { value: 'Docker', label: 'Docker' },
    { value: 'Kubernetes', label: 'Kubernetes' },
    { value: 'TensorFlow', label: 'TensorFlow' },
    { value: 'PyTorch', label: 'PyTorch' },
    { value: 'Machine Learning', label: 'Machine Learning' },
    { value: 'Deep learning', label: 'Deep learning' },
    { value: 'Natural language processing', label: 'Natural Language processing' },
    { value: 'Computer Vision', label: 'Computer Vision' },
    { value: 'Image processing', label: 'Image processing' },
    { value: 'Speech Recognistion', label: 'Speech Recognistion' },
    { value: 'Blockchain', label: 'Blockchain' },
    { value: 'Ethereum', label: 'Ethereum' },
    { value: 'Bitcoin', label: 'Bitcoin' },
    { value: 'Cryptocurrency', label: 'Cryptocurrency' },
    { value: 'Web3', label: 'Web3' },
    { value: 'Decentralized Finance', label: 'Decentralized Finance' },
    { value: 'Smart Contracts', label: 'Smart Contracts' },
    { value: 'NFT', label: 'NFT' },
    { value: 'DeFi', label: 'DeFi' },
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Mobile Development', label: 'Mobile Development' },
    { value: 'Game Development', label: 'Game Development' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Cybersecurity', label: 'Cybersecurity' },
    { value: 'Ethical Hacking', label: 'Ethical Hacking' },
    { value: 'Penetration Testing', label: 'Penetration Testing' },
    { value: 'Networking', label: 'Networking' },
    { value: 'Cloud Computing', label: 'Cloud Computing' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
    { value: 'Data Science', label: 'Data Science' },
    { value: 'Big Data', label: 'Big Data' },
    { value: 'Data Analysis', label: 'Data Analysis' },
    { value: 'Data Engineering', label: 'Data Engineering' },
    { value: 'Data Visualization', label: 'Data Visualization' },
    { value: 'Business Intelligence', label: 'Business Intelligence' },
    { value: 'Business Analysis', label: 'Business Analysis' },
    { value: 'Project Management', label: 'Project Management' },
    { value: 'Agile', label: 'Agile' },
    { value: 'Scrum', label: 'Scrum' },
    { value: 'RAG', label: 'RAG' },
    { value: 'Langchain', label: 'Langchain' },
    { value: 'LLMs', label: 'LLMs' },
    { value: 'Others', label: 'Others' }
  ];

  const { currentUser, userLoggedIn } = useAuth();

  const [feedback, setFeedback] = useState([]);
  const [interviewFeedback, setInterviewFeedback] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    problemStatement: '',
    description: '',
    technologies: '',
    level: '',
    duration: '',
    money: '',
    projectType: 'code' // default to code project
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [loadingInterviewFeedback, setLoadingInterviewFeedback] = useState(false);
  

  // Fetch feedback for the selected project
  const fetchFeedback = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/PM/projects/${selectedProject._id}/feedback`);
      setFeedback(response.data);

      // For each approved feedback, get interview feedback if exists
      const approvedFeedback = response.data.filter(fb => fb.status === 'approved');
      if (approvedFeedback.length > 0) {
        setLoadingInterviewFeedback(true);
        const interviewData = {};
        
        // Create an array of promises to fetch all interview feedback
        const fetchPromises = approvedFeedback.map(async (item) => {
          try {
            const response = await axios.get(
              `http://localhost:3000/PM/projects/${selectedProject._id}/interview-feedback/${item.userId}`
            );
            if (response.data && response.data.length > 0) {
              interviewData[item.userId] = response.data;
            }
          } catch (err) {
            console.error(`Error fetching interview feedback for ${item.userId}:`, err);
          }
        });
        
        // Wait for all requests to complete
        await Promise.all(fetchPromises);
        setInterviewFeedback(interviewData);
        setLoadingInterviewFeedback(false);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      setLoadingInterviewFeedback(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (selectedProject) {
      fetchFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/PM/projects/${currentUser.email}`);
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setLoading(false);
    }
  };

  const addProjectToDB = async (projectData) => {
    try {
      await axios.post('http://localhost:3000/PM/projects', projectData);
      fetchProjects();
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  const handleAddProject = () => {
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleTechChange = (selectedOptions) => {
    setFormData({
      ...formData,
      technologies: selectedOptions.map((option) => option.value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowModal(false);
    
    // Make sure technologies is always a valid array
    const projectData = {
      ...formData,
      userEmail: currentUser.email,
      technologies: formData.projectType === 'content' ? 
        // For content writing projects, provide default content-related technologies
        ['Content Writing', 'Blogging'] : 
        // For code projects, use selected technologies or empty array if none selected
        (Array.isArray(formData.technologies) ? formData.technologies : [])
    };
    
    await addProjectToDB(projectData);
    
    // Reset form data
    setFormData({
      projectName: '',
      problemStatement: '',
      description: '',
      technologies: '',
      level: '',
      duration: '',
      money: '',
      projectType: 'code' // default to code project
    });
  };

  // Update initial test feedback status
  const handleAccept = async (item) => {
    try {
      await axios.put(
        `http://localhost:3000/PM/projects/${selectedProject._id}/feedback/${item.userId}/status`,
        { status: "approved" }
      );
      // Refresh feedback after status update
      await fetchFeedback();
    } catch (error) {
      console.error('Error accepting feedback:', error);
    }
  };

  const handleReject = async (item) => {
    try {
      await axios.put(
        `http://localhost:3000/PM/projects/${selectedProject._id}/feedback/${item.userId}/status`,
        { status: "rejected" }
      );
      // Refresh feedback after status update
      await fetchFeedback();
    } catch (error) {
      console.error('Error rejecting feedback:', error);
    }
  };

  // Update interview feedback status (final decision)
  const handleAcceptInterview = async (developerEmail) => {
    if (!window.confirm(`Are you sure you want to ACCEPT this candidate for the project?`)) {
      return;
    }
    
    try {
      await axios.put(
        `http://localhost:3000/PM/projects/${selectedProject._id}/interview-feedback/${developerEmail}/status`,
        { status: "hired" }
      );
      // Refresh data
      await fetchFeedback();
      alert("Candidate has been accepted!");
    } catch (error) {
      console.error('Error accepting candidate:', error);
      alert("Error accepting candidate. Please try again.");
    }
  };

  const handleRejectInterview = async (developerEmail) => {
    if (!window.confirm(`Are you sure you want to REJECT this candidate?`)) {
      return;
    }
    
    try {
      await axios.put(
        `http://localhost:3000/PM/projects/${selectedProject._id}/interview-feedback/${developerEmail}/status`,
        { status: "rejected" }
      );
      // Refresh data
      await fetchFeedback();
      alert("Candidate has been rejected.");
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      alert("Error rejecting candidate. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleProjectClick = (project) => {
    setSelectedProject(project);
  };

  const handleCloseProjectDetails = () => {
    setSelectedProject(null);
    setInterviewFeedback({});
  };

  const generateQuestions = async () => {
    setIsGeneratingQuestion(true);
    try {
      const response = await axios.post('http://localhost:8008/generate-problems', {
        projectName: selectedProject.projectName,
        problemStatement: selectedProject.problemStatement,
        description: selectedProject.description,
        technologies: selectedProject.technologies,
        level: selectedProject.level,
        duration: selectedProject.duration,
        money: selectedProject.money
      });
      if (response.status === 200) {
        const questions = response.data.response;
        setGeneratedQuestions(questions);
        setQuestionModalOpen(true);
      } else {
        console.error('Error generating questions: Unexpected status code', response.status);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setIsGeneratingQuestion(false);
    }
  };

  useEffect(() => {
    // If the selected project doesn't have a question, generate one.
    if (selectedProject && !selectedProject.question) {
      generateQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProject]);

  const handleQuestionSelection = async () => {
    try {
      const updatedProject = {
        ...selectedProject,
        question: selectedQuestion
      };
      await axios.put(`http://localhost:3000/PM/projects/${selectedProject._id}`, updatedProject);
      setQuestionModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        await axios.delete(`http://localhost:3000/PM/projects/${projectId}`);
        // After successful deletion, refresh the projects list
        fetchProjects();
        // Close the modal if open
        setSelectedProject(null);
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  return (
    <div>
      <Navbar />
      <div className="text-2xl font-bold pt-14 mx-8">
        Welcome {currentUser.displayName ? currentUser.displayName : currentUser.email}, View & upload your Projects
      </div>
      <div className="text-2xl font-bold mx-8">
        <button
          onClick={handleAddProject}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Create Project
        </button>
      </div>

      {/* Add Project Modal */}
      <div className="mt-4">
        {showModal && (
          <div className="fixed inset-0 items-center justify-center bg-black bg-opacity-50 p-20">
          <div className="bg-white p-6 rounded-lg shadow-xl max-h-full overflow-y-auto w-full max-w-4xl mx-auto">
            <h2 className="text-lg font-bold mb-4">Add New Project</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">
                    Project Name
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleChange}
                    className="mt-1 p-2 border border-gray-300 rounded-md w-full text-sm"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Project Type
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        id="project-type-code"
                        name="projectType"
                        type="radio"
                        checked={formData.projectType === 'code'}
                        onChange={() => setFormData({...formData, projectType: 'code'})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="project-type-code" className="ml-2 block text-sm text-gray-700">
                        Code Project
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="project-type-content"
                        name="projectType" 
                        type="radio"
                        checked={formData.projectType === 'content'}
                        onChange={() => setFormData({...formData, projectType: 'content'})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="project-type-content" className="ml-2 block text-sm text-gray-700">
                        Content Writing Project
                      </label>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {formData.projectType === 'code' 
                      ? 'Developers will submit GitHub repositories for evaluation.' 
                      : 'Writers will submit blog URLs or content for evaluation.'}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="problemStatement" className="block text-sm font-medium text-gray-700">
                    Problem Statement
                  </label>
                  <textarea
                    id="problemStatement"
                    name="problemStatement"
                    value={formData.problemStatement}
                    onChange={handleChange}
                    rows="4"
                    className="mt-1 p-2 border border-gray-300 rounded-md w-full text-sm"
                    required
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Project Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    className="mt-1 p-2 border border-gray-300 rounded-md w-full text-sm"
                    required
                  ></textarea>
                </div>
                
                {formData.projectType === 'code' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700" htmlFor="technologies">
                      Technologies
                    </label>
                    <Select
                      isMulti
                      options={techOptions}
                      value={techOptions.filter((option) => formData.technologies.includes(option.value))}
                      onChange={handleTechChange}
                      className="basic-multi-select"
                      classNamePrefix="select"
                      name="technologies"
                      id="technologies"
                    />
                  </div>
                )}
                
                <div className="mb-4">
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700">
                    Level of Project
                  </label>
                  <select
                    id="level"
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="mt-1 p-2 border border-gray-300 rounded-md w-full text-sm"
                    required
                  >
                    <option value="">Select Level</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                    Time required to complete
                  </label>
                  <input
                    type="text"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleChange}
                    className="mt-1 p-2 border border-gray-300 rounded-md w-full text-sm"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="money" className="block text-sm font-medium text-gray-700">
                    Budget
                  </label>
                  <input
                    type="text"
                    id="money"
                    name="money"
                    value={formData.money}
                    onChange={handleChange}
                    className="mt-1 p-2 border border-gray-300 rounded-md w-full text-sm"
                    required
                  />
                </div>
                <div className="flex flex-col items-center sm:flex-row sm:justify-center sm:space-x-4">
                  <div className="p-2">
                    <button type="submit" className="bg-gradient-to-r from-blue-800 hover:bg-blue-500 text-white font-bold py-2 px-3 rounded">
                      Submit
                    </button>
                  </div>
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="bg-gradient-to-r from-red-800 hover:bg-red-500 text-white font-bold py-2 px-3 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <hr className="my-5" />

      <div className="bg-gray-100 p-6 rounded-lg shadow-md mx-8">
        <h2 className="text-lg font-semibold text-center mb-4">Ongoing Projects</h2>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <FallingLines height={100} width={100} color="blue" />
          </div>
        ) : projects.length === 0 ? (
          <p className="text-center text-black text-lg">No projects found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projects.map((project, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleProjectClick(project)}
              >
                <h3 className="text-lg font-semibold mb-2">{project.projectName}</h3>
                <p className="text-gray-600">{project.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-20">
          <div className="bg-white p-6 rounded-lg shadow-xl max-h-full overflow-y-auto w-full max-w-3xl">
            <h2 className="text-lg font-bold mb-4">Project Details</h2>
            <p>
              <strong>Project Name:</strong> {selectedProject.projectName}
            </p>
            <p>
              <strong>Problem Statement:</strong> {selectedProject.problemStatement}
            </p>
            <p>
              <strong>Description:</strong> {selectedProject.description}
            </p>
            <p>
              <strong>Technologies:</strong> {selectedProject.technologies.join(', ')}
            </p>
            <p>
              <strong>Level:</strong> {selectedProject.level}
            </p>
            <p>
              <strong>Duration:</strong> {selectedProject.duration} hrs
            </p>
            <p>
              <strong>Budget:</strong> ₹{selectedProject.money}
            </p>
            {selectedProject.question === null ? (
            <div className="my-4">
              {isGeneratingQuestion ? (
                <div className="flex flex-col items-center justify-center space-y-4 p-8">
                  <div className="relative">
                    <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 border-t-4 border-blue-300 border-solid rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <p className="text-lg text-gray-600 font-medium">Generating problem statements...</p>
                  <p className="text-sm text-gray-500">This may take a few moments</p>
                </div>
              ) : (
                <button
                  onClick={generateQuestions}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Choose a Problem Statement
                </button>
              )}
            </div>
          ) : (
            <p className="my-4">
              <strong>Question:</strong> {selectedProject.question}
            </p>
          )}

            {/* Initial Test Results Section */}
            <div className="mt-8 max-w-10xl">
              <h3 className="text-xl font-bold mb-4">Initial Test Results</h3>
              {feedback.length === 0 ? (
                <p className="text-gray-600">No test results available.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden mb-8">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 bg-gray-200 p-4 border-b font-semibold text-sm">
                    <div className="col-span-3 truncate pr-4 border-r">User</div>
                    <div className="col-span-6 px-4 border-r">Details</div>
                    <div className="col-span-3 text-center">Actions</div>
                  </div>
                  
                  {/* Table Rows */}
                  <div className="divide-y">
                    {feedback.map((item, index) => (
                      <div
                          key={index}
                          className="grid grid-cols-12 gap-4 items-start p-4 hover:bg-gray-50 transition-colors"
                      >
                          {/* User Info */}
                          <div className="col-span-3 pr-4 border-r truncate">
                              <p className="font-medium text-gray-900">{item.userId}</p>
                              <p className={`text-sm ${
                                  item.status === 'approved' ? 'text-green-600' :
                                  item.status === 'rejected' ? 'text-red-600' :
                                  'text-yellow-600'
                              }`}>
                                  Status: {item.status || 'pending'}
                              </p>
                          </div>

                          {/* Test Details */}
                          <div className="col-span-6 px-4 border-r">
                              <div className="flex flex-col space-y-3">
                                  <div className="flex items-center">
                                      <span className="text-sm font-medium w-24">Grade:</span>
                                      <span className="text-sm text-gray-600">{item.grade}</span>
                                  </div>
                                  <div className="flex items-start">
                                      <span className="text-sm font-medium w-24">Comments:</span>
                                      <span className="text-sm text-gray-600 break-words flex-1">
                                          {item.justification}
                                      </span>
                                  </div>
                              </div>
                          </div>

                          {/* Actions */}
                          <div className="col-span-3 flex justify-center space-x-2">
                              {!item.status && (
                                  <>
                                      <button
                                          onClick={() => handleAccept(item)}
                                          className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors text-sm"
                                      >
                                          Accept
                                      </button>
                                      <button
                                          onClick={() => handleReject(item)}
                                          className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm"
                                      >
                                          Reject
                                      </button>
                                  </>
                              )}
                              {item.status && (
                                  <span className={`px-4 py-2 rounded-md text-sm ${
                                      item.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      'bg-red-100 text-red-800'
                                  }`}>
                                      {item.status === 'approved' ? 'Approved' : 'Rejected'}
                                  </span>
                              )}
                          </div>
                      </div>
                  ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interview Results Section */}
            <div className="mt-8 max-w-10xl">
              <h3 className="text-xl font-bold mb-4">AI Interview Results</h3>
              {loadingInterviewFeedback ? (
                <div className="flex justify-center my-8">
                  <div className="w-8 h-8 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                  <p className="ml-3">Loading interview results...</p>
                </div>
              ) : Object.keys(interviewFeedback).length === 0 ? (
                <p className="text-gray-600">No interview results available yet.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(interviewFeedback).map(([email, feedbackList], idx) => {
                    const latestFeedback = feedbackList[feedbackList.length - 1];
                    const hasDecision = latestFeedback.status === 'hired' || latestFeedback.status === 'rejected';
                    
                    return (
                      <div key={idx} className="bg-white rounded-lg shadow p-6 border border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">{email}</h4>
                            {hasDecision && (
                              <div className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mt-1 ${
                                latestFeedback.status === 'hired' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {latestFeedback.status === 'hired' ? 'Hired' : 'Rejected'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center">
                            <div className="text-2xl font-bold mr-2">
                              {latestFeedback.grade}/10
                            </div>
                            <div className="text-sm text-gray-500">
                              Grade
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Interview Feedback:</h5>
                          <div className="bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-line">
                            {latestFeedback.feedback}
                          </div>
                        </div>
                        
                        {!hasDecision && (
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => handleRejectInterview(email)}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Reject Candidate
                            </button>
                            <button
                              onClick={() => handleAcceptInterview(email)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Accept Candidate
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => handleDeleteProject(selectedProject._id)}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded flex items-center mr-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Delete Project
              </button>
              <button
                onClick={handleCloseProjectDetails}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Modal */}
      {questionModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-20">
          <div className="bg-white p-6 rounded-lg shadow-xl max-h-full overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Select a Problem Statement</h2>
            <div className="space-y-4">
              {Object.keys(generatedQuestions).map((questionKey, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`question-${index}`}
                    name="selectedQuestion"
                    value={generatedQuestions[questionKey]}
                    onChange={() => setSelectedQuestion(generatedQuestions[questionKey])}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  <label htmlFor={`question-${index}`} className="ml-2">
                    {generatedQuestions[questionKey]}
                  </label>
                </div>
              ))}

              <div className="flex justify-end mt-4">
                <button
                  onClick={handleQuestionSelection}
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Make this the Problem Statement
                </button>
                <button
                  onClick={() => setQuestionModalOpen(false)}
                  className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <hr className="my-6" />
    </div>
  );
};

export default Dashboard;