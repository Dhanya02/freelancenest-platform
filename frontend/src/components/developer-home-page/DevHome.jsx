import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../Navbar';
import { useAuth } from '../../contexts/authContext';

const DevHome = () => {
    const [projects, setProjects] = useState([]);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [githubRepo, setGithubRepo] = useState('');
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const { currentUser } = useAuth();
    const [submissionType, setSubmissionType] = useState('code');
    const [blogUrl, setBlogUrl] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const email = currentUser?.email;
                const response = await axios.get(`http://localhost:3000/PM/allprojects?email=${email}`);
                setProjects(response.data);
            } catch (error) {
                console.error('Error fetching projects:', error);
                setError(error.message);
            }
        };
    
        fetchProjects();
    }, [currentUser]);

    useEffect(() => {
        if (selectedProject) {
            // Automatically set submission type based on project type
            const projectType = selectedProject.projectType || 'code';
            setSubmissionType(projectType);
            console.log(`Project detected as ${projectType} type`);
        }
    }, [selectedProject]);

    const fetchLeaderboard = async () => {
        try {
            const response = await axios.get('http://localhost:3000/freelancer/leaderboard');
            setLeaderboardData(response.data);
            setShowLeaderboard(true);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setError('Failed to load leaderboard');
        }
    };

    const handleCardClick = (project) => {
        setSelectedProject(project);
        setShowSubmissionForm(false);
        setSubmissionSuccess(false);
        setGithubRepo('');
    };

    const closeModal = () => {
        setSelectedProject(null);
        setSubmissionSuccess(false);
        setShowSubmissionForm(false);
        setGithubRepo('');
    };

    const handleApply = () => {
        setShowSubmissionForm(true);
    };

    const handleSubmission = async (event) => {
        event.preventDefault();
        if (!selectedProject || !currentUser?.email) return;
        
        // Validate required fields based on submission type
        if (submissionType === 'code' && !githubRepo) {
          setError('Please provide a GitHub repository URL.');
          return;
        } else if (submissionType === 'content' && !blogUrl) {
          setError('Please provide a blog URL.');
          return;
        }
      
        setIsLoading(true);
        try {
          const email = currentUser.email;
          const projectId = selectedProject._id;
      
          // Add developer to the project
          await axios.post(`http://localhost:3000/freelancer/projects/${projectId}/add-email`, { email });
      
          if (submissionType === 'code') {
            // Code submission flow
            await axios.post(`http://localhost:3000/freelancer/projects/${projectId}/submit`, {
              developerEmail: email,
              githubLink: githubRepo
            });
      
            const githubResponse = await axios.post('http://localhost:8008/analyse-submission', {
              problem_statement: selectedProject.question,
              github_url: githubRepo
            });
      
            const { grade, justification, user_feedback } = githubResponse.data.response;
      
            await axios.put(`http://localhost:3000/PM/projects/${projectId}/feedback/${email}`, {
              grade,
              justification,
              user_feedback
            });
          } else {
            // Blog content submission flow
            await axios.post(`http://localhost:3000/freelancer/projects/${projectId}/submit-blog`, {
              developerEmail: email,
              blogUrl: blogUrl
            });
      
            const blogResponse = await axios.post('http://localhost:8008/analyse-blog-url', {
              url: blogUrl
            });
      
            const { 
              overall_score, 
              writing_style, 
              strengths, 
              weaknesses, 
              improvement_suggestions 
            } = blogResponse.data.response;
      
            // Format the user feedback
            const user_feedback = `
      Strengths:
      ${strengths.join('\n')}
      
      Areas for Improvement:
      ${weaknesses.join('\n')}
      
      Recommendations:
      ${improvement_suggestions.join('\n')}
            `;
      
            await axios.put(`http://localhost:3000/PM/projects/${projectId}/feedback/${email}`, {
              grade: Math.round(overall_score),
              justification: writing_style,
              user_feedback
            });
          }
          
          setSubmissionSuccess(true);
          // Automatically close modal after successful submission
          setTimeout(closeModal, 1500);
        } catch (error) {
          console.error('Error during submission:', error);
          setError('Submission failed. Please try again.');
          // Close modal on error as well
          setTimeout(closeModal, 1500);
        } finally {
          setIsLoading(false);
        }
      };

    return (
        <div>
            <div>
                <Navbar />
            </div>
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="bg-blue py-3 px-4 text-center">Explore Projects</h1>
                    <button
                        onClick={fetchLeaderboard}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        View Leaderboard 🏆
                    </button>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                    {projects.map(project => (
                        <div
                            key={project._id}
                            className="bg-white shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200"
                            onClick={() => handleCardClick(project)}
                        >
                            <h2 className="text-xl font-semibold">{project.projectName}</h2>
                            <p className="text-gray-600">{project.description}</p>
                        </div>
                    ))}
                </div>

                {showLeaderboard && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                            <h3 className="text-2xl font-bold mb-4 text-center flex items-center justify-center">
                                                <span className="mr-2">🏆</span> Developer Leaderboard
                                            </h3>
                                            <div className="mt-4">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Developer</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projects</th>
                                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Grade</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {leaderboardData.map((dev) => (
                                                            <tr key={dev.email} className={dev.rank <= 3 ? 'bg-yellow-50' : ''}>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    {dev.rank <= 3 ? ['🥇', '🥈', '🥉'][dev.rank - 1] : dev.rank}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{dev.email}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">{dev.total_projects}</td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                        {dev.average_grade.toFixed(2)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        onClick={() => setShowLeaderboard(false)}
                                        className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {selectedProject && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-2xl font-bold mb-4">{selectedProject.projectName}</h3>
                                            <div className="mt-2 space-y-3">
                                                <p><span className="font-bold">Description:</span> {selectedProject.description}</p>
                                                <p><span className="font-bold">Skills Required:</span> {selectedProject.technologies.join(', ')}</p>
                                                <p><span className="font-bold">Budget:</span> ₹{selectedProject.money}</p>
                                                <p><span className="font-bold">Duration:</span> {selectedProject.duration} Hrs</p>
                                                <p><span className="font-bold">Assessment Question:</span> {selectedProject.question}</p>
                                            </div>

                                            {showSubmissionForm && !submissionSuccess && (
                                                <form onSubmit={handleSubmission} className="mt-6 space-y-4">
                                                    <div className="mb-4">
                                                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                            submissionType === 'code' 
                                                                ? 'bg-blue-100 text-blue-800' 
                                                                : 'bg-purple-100 text-purple-800'
                                                        }`}>
                                                            <span className="mr-1">
                                                                {submissionType === 'code' ? '💻' : '✍️'}
                                                            </span>
                                                            {submissionType === 'code' ? 'Code Project' : 'Content Writing Project'}
                                                        </div>
                                                    </div>
                                                    
                                                    {submissionType === 'code' ? (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">GitHub Repository</label>
                                                            <input
                                                                type="text"
                                                                value={githubRepo}
                                                                onChange={(e) => setGithubRepo(e.target.value)}
                                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                                required
                                                                placeholder="https://github.com/yourusername/your-repo"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700">Blog URL</label>
                                                            <input
                                                                type="url"
                                                                value={blogUrl}
                                                                onChange={(e) => setBlogUrl(e.target.value)}
                                                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                                required
                                                                placeholder="https://yourblog.com/your-article"
                                                            />
                                                        </div>
                                                    )}
                                                    <button
                                                        type="submit"
                                                        disabled={isLoading}
                                                        className={`w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 
                                                            ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
                                                            text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                                    >
                                                        {isLoading ? (
                                                            <>
                                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Processing...
                                                            </>
                                                        ) : 'Submit Project'}
                                                    </button>
                                                </form>
                                            )}

                                            {submissionSuccess && (
                                                <div className="mt-6 p-4 bg-green-50 rounded-md">
                                                    <h2 className="text-xl font-semibold text-green-800">Submission Successful!</h2>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    {!showSubmissionForm && !submissionSuccess && (
                                        <button
                                            onClick={handleApply}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 
                                                bg-blue-600 hover:bg-blue-700 
                                                text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
                                                sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            Apply & Continue
                                        </button>
                                    )}
                                    <button
                                        onClick={closeModal}
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DevHome;