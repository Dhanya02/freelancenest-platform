// // import React, { useState, useEffect } from 'react';
// // import axios from 'axios'; // Import Axios
// // import { useAuth } from '../../contexts/authContext';
// // import { useNavigate } from 'react-router-dom'; // Import useNavigate
// // import { FallingLines } from 'react-loader-spinner';
// // import Select from 'react-select';
// // import Navbar from '../Navbar';

// // const Profile = () => {
// //     const techOptions = [
// //         { value: 'React', label: 'React' },
// //         { value: 'Node.js', label: 'Node.js' },
// //         { value: 'JavaScript', label: 'JavaScript' },
// //         { value: 'Python', label: 'Python' },
// //         { value: 'Java', label: 'Java' },
// //         { value: 'Ruby', label: 'Ruby' },
// //         { value: 'Swift', label: 'Swift' },
// //         { value: 'HTML/CSS', label: 'HTML/CSS' },
// //         { value: 'SQL', label: 'SQL' },
// //         { value: 'MongoDB', label: 'MongoDB' },
// //         { value: 'Firebase', label: 'Firebase' },
// //         { value: 'AWS', label: 'AWS' },
// //         { value: 'Azure', label: 'Azure' },
// //         { value: 'GCP', label: 'GCP' },
// //         { value: 'Docker', label: 'Docker' },
// //         { value: 'Kubernetes', label: 'Kubernetes' },
// //         { value: 'TensorFlow', label: 'TensorFlow' },
// //         { value: 'PyTorch', label: 'PyTorch' },
// //         { value: 'Machine Learning', label: 'Machine Learning' },
// //         { value: 'Deep learning', label: 'Deep learning' },
// //         { value: 'Natural language processing', label: 'Natural Language processing' },
// //         { value: 'Computer Vision', label: 'Computer Vision' },
// //         { value: 'Image processing', label: 'Image processing' },
// //         { value: 'Speech Recognistion', label: 'Speech Recognistion' },
// //         { value: 'Blockchain', label: 'Blockchain' },
// //         { value: 'Ethereum', label: 'Ethereum' },
// //         { value: 'Bitcoin', label: 'Bitcoin' },
// //         { value: 'Cryptocurrency', label: 'Cryptocurrency' },
// //         { value: 'Web3', label: 'Web3' },
// //         { value: 'Decentralized Finance', label: 'Decentralized Finance' },
// //         { value: 'Smart Contracts', label: 'Smart Contracts' },
// //         { value: 'NFT', label: 'NFT' },
// //         { value: 'DeFi', label: 'DeFi' },
// //         { value: 'Web Development', label: 'Web Development' },
// //         { value: 'Mobile Development', label: 'Mobile Development' },
// //         { value: 'Game Development', label: 'Game Development' },
// //         { value: 'UI/UX Design', label: 'UI/UX Design' },
// //         { value: 'Cybersecurity', label: 'Cybersecurity' },
// //         { value: 'Ethical Hacking', label: 'Ethical Hacking' },
// //         { value: 'Penetration Testing', label: 'Penetration Testing' },
// //         { value: 'Networking', label: 'Networking' },
// //         { value: 'Cloud Computing', label: 'Cloud Computing' },
// //         { value: 'DevOps', label: 'DevOps' },
// //         { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
// //         { value: 'Data Science', label: 'Data Science' },
// //         { value: 'Big Data', label: 'Big Data' },
// //         { value: 'Data Analysis', label: 'Data Analysis' },
// //         { value: 'Data Engineering', label: 'Data Engineering' },
// //         { value: 'Data Visualization', label: 'Data Visualization' },
// //         { value: 'Business Intelligence', label: 'Business Intelligence' },
// //         { value: 'Business Analysis', label: 'Business Analysis' },
// //         { value: 'Project Management', label: 'Project Management' },
// //         { value: 'Agile', label: 'Agile' },
// //         { value: 'Scrum', label: 'Scrum' },
// //         { value: 'RAG', label: 'RAG' },
// //         { value: 'Langchain', label: 'Langchain' },
// //         { value: 'LLMs', label: 'LLMs' },
// //         { value: 'Others', label: 'Others' },
// //     ];

// //     const [expandedProject, setExpandedProject] = useState(null);
// //     const [showFeedback, setShowFeedback] = useState(null);
// //     const [showInterviewModal, setShowInterviewModal] = useState(false);
// //     const [selectedInterviewProject, setSelectedInterviewProject] = useState(null);

// //     const { currentUser, isDeveloper, isProjectManager } = useAuth();
// //     console.log(currentUser);
// //     console.log("isDeveloper", isDeveloper);
// //     console.log("isProjectManager", isProjectManager);
// //     const [userData, setUserData] = useState({
// //         firstName: '',
// //         lastName: '',
// //         email: '',
// //         github: '',
// //         linkedin: '',
// //         techStack: [],
// //         //profilePhoto: null,
// //     });
// //     const [projects, setProjects] = useState([]);
// //     const [loading, setLoading] = useState(true);
// //     const navigate = useNavigate(); // Initialize useNavigate hook

// //     // Function to fetch user data from the backend
// //     const fetchUserData = async () => {
// //         try {
// //             // const response = await axios.get(`https://freelancenest-backend.onrender.com/freelancer/developers/${currentUser.email}`);
// //             const response = await axios.get(`http://localhost:3000/freelancer/developers/${currentUser.email}`);
// //             console.log("response data", response.data);
// //             setUserData(response.data);
// //         } catch (error) {
// //             console.error('Error fetching user data:', error);
// //         }
// //     };

// //     // Function to fetch projects data from the backend based on user role
// //     const fetchProjects = async () => {
// //         try {
// //             let response;
// //             if (isDeveloper) {
// //                 console.log(currentUser.email);
// //                 console.log(isDeveloper);
// //                 // response = await axios.get(`https://freelancenest-backend.onrender.com/projects/assigned/${currentUser.email}`);
// //                 response = await axios.get(`http://localhost:3000/freelancer/developers/${currentUser.email}/projects`);
// //                 console.log("response data projects", response.data);
// //             } else if (isProjectManager) {
// //                 console.log(currentUser.email);
// //                 console.log(isProjectManager);
// //                 // response = await axios.get(`https://freelancenest-backend.onrender.com/projects/created/${currentUser.email}`);
// //                 response = await axios.get(`http://localhost:3000/PM/projects/created/${currentUser.email}`);
// //             }
// //             setProjects(response.data);
// //             setLoading(false);
// //         } catch (error) {
// //             console.error('Error fetching projects:', error);
// //             setLoading(false);
// //         }
// //     };

// //     // Function to save changes to the backend
// //     const saveChanges = async () => {
// //         try {
// //             // Assuming you have an endpoint to update user data
// //             // await axios.post(`https://freelancenest-backend.onrender.com/freelancer/developers/${currentUser.email}`, 
// //             await axios.post(`http://localhost:3000/freelancer/developers/${currentUser.email}`,
// //                 {
// //                     firstName: userData.firstName,
// //                     lastName: userData.lastName,
// //                     github: userData.github,
// //                     linkedin: userData.linkedin,
// //                     techStack: userData.techStack,
// //                 }
// //             );
// //             console.log('User data updated successfully');
// //         } catch (error) {
// //             console.error('Error updating user data: ', error);
// //         }
// //     };

// //     // Function to handle profile photo selection
// //     const handleProfilePhotoChange = (e) => {
// //         const file = e.target.files[0];
// //         setUserData({ ...userData, profilePhoto: file });
// //     };

// //     // Function to handle form input changes
// //     const handleInputChange = (e) => {
// //         const { name, value } = e.target;
// //         setUserData({ ...userData, [name]: value });
// //     };

// //     // Function to handle tech stack selection
// //     const handleTechStackChange = (selectedOptions) => {
// //         setUserData({
// //             ...userData,
// //             techStack: selectedOptions.map(option => option.value)
// //         });
// //     };

// //     // Function to start AI interview
// //     const startAIInterview = (project) => {
// //         setSelectedInterviewProject(project);
// //         setShowInterviewModal(true);
// //     };

// //     useEffect(() => {
// //         if (currentUser) {
// //             // fetchUserData();
// //             fetchProjects();
// //         }
// //     }, [currentUser, isDeveloper, isProjectManager]);

// //     if (!currentUser) {
// //         navigate('/login'); // Use navigate instead of useHistory
// //         return null;
// //     }

// //     return (
// //         <div>
// //             <div>
// //                 <Navbar />
// //             </div>
// //             <div className="container grid my-8 mx-auto mt-10 ">
// //                 {/* Project section */}
// //                 <h1 className="text-4xl font-semibold  mb-4 text-center my-6">{!isDeveloper ? 'Created Projects' : 'Assigned Projects'}</h1>
// //                 {loading ? (
// //                     <div className="flex justify-center">
// //                         <FallingLines
// //                             color="blue"
// //                             height={100}
// //                             width={100}
// //                         />
// //                     </div>
// //                 ) : (
// //                     projects.length === 0 ? (
// //                         <p className="text-center p-8">No projects found</p>
// //                     ) : (
// //                         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
// //                             {projects.map(project => {
// //                                 const projectData = project;
// //                                 return (
// //                                     <div key={project._id} className="bg-white shadow-md rounded-md p-4">
// //                                         {/* Basic Info - Always Visible */}
// //                                         <h4 className="text-lg font-semibold mb-2 cursor-pointer"
// //                                             onClick={() => setExpandedProject(expandedProject === project._id ? null : project._id)}>
// //                                             {projectData.projectName} ↓
// //                                         </h4>

// //                                         {isDeveloper && projectData.feedback && projectData.feedback.length > 0 && (
// //                                             <div className="mb-4">
// //                                                 {projectData.feedback.map((fb, idx) => {
// //                                                     if (fb.userId === currentUser.email) {
// //                                                         return (
// //                                                             <div key={idx}>
// //                                                                 <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
// //                                                                     ${!fb.status ? 'bg-yellow-100 text-yellow-800' :
// //                                                                     fb.status === 'approved' ? 'bg-green-100 text-green-800' :
// //                                                                     'bg-red-100 text-red-800'}`}>
// //                                                                     {!fb.status ? 'Pending Approval' :
// //                                                                     fb.status === 'approved' ? 'Approved - Ready for Test 2' :
// //                                                                     'Submission Rejected'}
// //                                                                 </div>
                                                                
// //                                                                 {/* Show action message based on status */}
// //                                                                 {fb.status === 'approved' && (
// //                                                                     <div className="mt-3">
// //                                                                         <p className="text-green-700 mb-2">
// //                                                                             Congratulations! You've been accepted for the second round.
// //                                                                         </p>
// //                                                                         <button 
// //                                                                             onClick={() => startAIInterview(project)}
// //                                                                             className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
// //                                                                         >
// //                                                                             Start AI Interview
// //                                                                         </button>
// //                                                                     </div>
// //                                                                 )}
                                                                
// //                                                                 {fb.status === 'rejected' && (
// //                                                                     <div className="mt-3">
// //                                                                         <p className="text-red-700">
// //                                                                             Unfortunately, you were not selected for the second round.
// //                                                                         </p>
// //                                                                     </div>
// //                                                                 )}
// //                                                             </div>
// //                                                         );
// //                                                     }
// //                                                     return null;
// //                                                 })}
// //                                             </div>
// //                                         )}

// //                                         {/* Expandable Details */}
// //                                         {expandedProject === project._id && (
// //                                             <div className="mt-4 space-y-2">
// //                                                 <p className="text-sm text-700">{projectData.description}</p>
// //                                                 <p className="text-sm text-700">
// //                                                     <strong>Technologies:</strong> {projectData.technologies.join(', ')}
// //                                                 </p>
// //                                                 <p className="text-sm text-700"><strong>Level:</strong> {projectData.level}</p>
// //                                                 <p className="text-sm text-700"><strong>Duration:</strong> {projectData.duration}</p>
// //                                                 <p className="text-sm text-700"><strong>Budget:</strong> {projectData.money}</p>
                                                
// //                                                 {/* Feedback Section */}
// //                                                 {projectData.feedback && projectData.feedback.length > 0 && (
// //                                                     <div className="mt-4">
// //                                                         <button 
// //                                                             onClick={() => setShowFeedback(showFeedback === project._id ? null : project._id)}
// //                                                             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
// //                                                         >
// //                                                             {showFeedback === project._id ? 'Hide Feedback' : 'View Feedback'}
// //                                                         </button>
                                                        
// //                                                         {showFeedback === project._id && (
// //                                                             <div className="mt-4 p-4 bg-gray-50 rounded-md">
// //                                                                 {projectData.feedback.map((fb, idx) => (
// //                                                                     <div key={idx} className="mb-4">
// //                                                                         <p><strong>Grade:</strong> {fb.grade}/10</p>
// //                                                                         <p><strong>Feedback:</strong></p>
// //                                                                         <p className="whitespace-pre-line text-sm">
// //                                                                             {fb.user_feedback}
// //                                                                         </p>
// //                                                                     </div>
// //                                                                 ))}
// //                                                             </div>
// //                                                         )}
// //                                                     </div>
// //                                                 )}
// //                                             </div>
// //                                         )}
// //                                     </div>
// //                                 );
// //                             })}
// //                         </div>
// //                     )
// //                 )}
                
// //                 {/* AI Interview Modal */}
// //                 {showInterviewModal && selectedInterviewProject && (
// //                     <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
// //                         <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
// //                             <h3 className="text-xl font-bold mb-4">AI Technical Interview for {selectedInterviewProject.projectName}</h3>
// //                             <p className="mb-4">
// //                                 You're about to start a technical AI interview for this project. The AI will ask you questions related to 
// //                                 the technologies and requirements of this project.
// //                             </p>
// //                             <p className="mb-6">
// //                                 This interview will help assess your technical knowledge and problem-solving skills.
// //                             </p>
                            
// //                             <div className="flex justify-end space-x-4">
// //                                 <button 
// //                                     onClick={() => setShowInterviewModal(false)}
// //                                     className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
// //                                 >
// //                                     Cancel
// //                                 </button>
// //                                 <button 
// //                                     onClick={() => {
// //                                         setShowInterviewModal(false);
// //                                         // Redirect to the interview page with project ID
// //                                         navigate(`/ai-interview/${selectedInterviewProject._id}`);
// //                                     }}
// //                                     className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
// //                                 >
// //                                     Start Interview
// //                                 </button>
// //                             </div>
// //                         </div>
// //                     </div>
// //                 )}
// //             </div>
// //         </div>
// //     );
// // };

// // export default Profile;

// import React, { useState, useEffect } from 'react';
// import axios from 'axios'; // Import Axios
// import { useAuth } from '../../contexts/authContext';
// import { useNavigate } from 'react-router-dom'; // Import useNavigate
// import { FallingLines } from 'react-loader-spinner';
// import Select from 'react-select';
// import Navbar from '../Navbar';

// const Profile = () => {
//     const techOptions = [
//         { value: 'React', label: 'React' },
//         { value: 'Node.js', label: 'Node.js' },
//         { value: 'JavaScript', label: 'JavaScript' },
//         { value: 'Python', label: 'Python' },
//         { value: 'Java', label: 'Java' },
//         { value: 'Ruby', label: 'Ruby' },
//         { value: 'Swift', label: 'Swift' },
//         { value: 'HTML/CSS', label: 'HTML/CSS' },
//         { value: 'SQL', label: 'SQL' },
//         { value: 'MongoDB', label: 'MongoDB' },
//         { value: 'Firebase', label: 'Firebase' },
//         { value: 'AWS', label: 'AWS' },
//         { value: 'Azure', label: 'Azure' },
//         { value: 'GCP', label: 'GCP' },
//         { value: 'Docker', label: 'Docker' },
//         { value: 'Kubernetes', label: 'Kubernetes' },
//         { value: 'TensorFlow', label: 'TensorFlow' },
//         { value: 'PyTorch', label: 'PyTorch' },
//         { value: 'Machine Learning', label: 'Machine Learning' },
//         { value: 'Deep learning', label: 'Deep learning' },
//         { value: 'Natural language processing', label: 'Natural Language processing' },
//         { value: 'Computer Vision', label: 'Computer Vision' },
//         { value: 'Image processing', label: 'Image processing' },
//         { value: 'Speech Recognistion', label: 'Speech Recognistion' },
//         { value: 'Blockchain', label: 'Blockchain' },
//         { value: 'Ethereum', label: 'Ethereum' },
//         { value: 'Bitcoin', label: 'Bitcoin' },
//         { value: 'Cryptocurrency', label: 'Cryptocurrency' },
//         { value: 'Web3', label: 'Web3' },
//         { value: 'Decentralized Finance', label: 'Decentralized Finance' },
//         { value: 'Smart Contracts', label: 'Smart Contracts' },
//         { value: 'NFT', label: 'NFT' },
//         { value: 'DeFi', label: 'DeFi' },
//         { value: 'Web Development', label: 'Web Development' },
//         { value: 'Mobile Development', label: 'Mobile Development' },
//         { value: 'Game Development', label: 'Game Development' },
//         { value: 'UI/UX Design', label: 'UI/UX Design' },
//         { value: 'Cybersecurity', label: 'Cybersecurity' },
//         { value: 'Ethical Hacking', label: 'Ethical Hacking' },
//         { value: 'Penetration Testing', label: 'Penetration Testing' },
//         { value: 'Networking', label: 'Networking' },
//         { value: 'Cloud Computing', label: 'Cloud Computing' },
//         { value: 'DevOps', label: 'DevOps' },
//         { value: 'Artificial Intelligence', label: 'Artificial Intelligence' },
//         { value: 'Data Science', label: 'Data Science' },
//         { value: 'Big Data', label: 'Big Data' },
//         { value: 'Data Analysis', label: 'Data Analysis' },
//         { value: 'Data Engineering', label: 'Data Engineering' },
//         { value: 'Data Visualization', label: 'Data Visualization' },
//         { value: 'Business Intelligence', label: 'Business Intelligence' },
//         { value: 'Business Analysis', label: 'Business Analysis' },
//         { value: 'Project Management', label: 'Project Management' },
//         { value: 'Agile', label: 'Agile' },
//         { value: 'Scrum', label: 'Scrum' },
//         { value: 'RAG', label: 'RAG' },
//         { value: 'Langchain', label: 'Langchain' },
//         { value: 'LLMs', label: 'LLMs' },
//         { value: 'Others', label: 'Others' },
//     ];

//     const [expandedProject, setExpandedProject] = useState(null);
//     const [showFeedback, setShowFeedback] = useState(null);
//     const [showInterviewModal, setShowInterviewModal] = useState(false);
//     const [selectedInterviewProject, setSelectedInterviewProject] = useState(null);
//     const [interviewFeedback, setInterviewFeedback] = useState({});

//     const { currentUser, isDeveloper, isProjectManager } = useAuth();
//     const [userData, setUserData] = useState({
//         firstName: '',
//         lastName: '',
//         email: '',
//         github: '',
//         linkedin: '',
//         techStack: [],
//     });
//     const [projects, setProjects] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const navigate = useNavigate();

//     // Function to fetch user data from the backend
//     const fetchUserData = async () => {
//         try {
//             const response = await axios.get(`http://localhost:3000/freelancer/developers/${currentUser.email}`);
//             setUserData(response.data);
//         } catch (error) {
//             console.error('Error fetching user data:', error);
//         }
//     };

//     // Function to fetch interview feedback for a project
//     const fetchInterviewFeedback = async (projectId, developerEmail) => {
//         try {
//             const response = await axios.get(`http://localhost:3000/PM/projects/${projectId}/interview-feedback/${developerEmail}`);
//             return response.data.length > 0;
//         } catch (error) {
//             console.error('Error fetching interview feedback:', error);
//             return false;
//         }
//     };

//     // Function to fetch projects data from the backend based on user role
//     const fetchProjects = async () => {
//         try {
//             let response;
//             if (isDeveloper) {
//                 response = await axios.get(`http://localhost:3000/freelancer/developers/${currentUser.email}/projects`);

//                 // For each project that has feedback with approved status, check if interview feedback exists
//                 const projectsWithInterviewStatus = await Promise.all(
//                     response.data.map(async (project) => {
//                         if (project.feedback && project.feedback.length > 0) {
//                             const userFeedback = project.feedback.find(fb => fb.userId === currentUser.email);
//                             if (userFeedback && userFeedback.status === 'approved') {
//                                 const hasInterviewFeedback = await fetchInterviewFeedback(project._id, currentUser.email);
//                                 setInterviewFeedback(prev => ({
//                                     ...prev,
//                                     [project._id]: hasInterviewFeedback
//                                 }));
//                             }
//                         }
//                         return project;
//                     })
//                 );
//                 setProjects(response.data);
//             } else if (isProjectManager) {
//                 response = await axios.get(`http://localhost:3000/PM/projects/created/${currentUser.email}`);
//                 setProjects(response.data);
//             }
//             setLoading(false);
//         } catch (error) {
//             console.error('Error fetching projects:', error);
//             setLoading(false);
//         }
//     };

//     // Function to save changes to the backend
//     const saveChanges = async () => {
//         try {
//             await axios.post(`http://localhost:3000/freelancer/developers/${currentUser.email}`,
//                 {
//                     firstName: userData.firstName,
//                     lastName: userData.lastName,
//                     github: userData.github,
//                     linkedin: userData.linkedin,
//                     techStack: userData.techStack,
//                 }
//             );
//             console.log('User data updated successfully');
//         } catch (error) {
//             console.error('Error updating user data: ', error);
//         }
//     };

//     // Function to handle profile photo selection
//     const handleProfilePhotoChange = (e) => {
//         const file = e.target.files[0];
//         setUserData({ ...userData, profilePhoto: file });
//     };

//     // Function to handle form input changes
//     const handleInputChange = (e) => {
//         const { name, value } = e.target;
//         setUserData({ ...userData, [name]: value });
//     };

//     // Function to handle tech stack selection
//     const handleTechStackChange = (selectedOptions) => {
//         setUserData({
//             ...userData,
//             techStack: selectedOptions.map(option => option.value)
//         });
//     };

//     // Function to start AI interview
//     const startAIInterview = (project) => {
//         setSelectedInterviewProject(project);
//         setShowInterviewModal(true);
//     };

//     useEffect(() => {
//         if (currentUser) {
//             fetchProjects();
//         }
//     }, [currentUser, isDeveloper, isProjectManager]);

//     if (!currentUser) {
//         navigate('/login');
//         return null;
//     }

//     return (
//         <div>
//             <div>
//                 <Navbar />
//             </div>
//             <div className="container grid my-8 mx-auto mt-10 ">
//                 {/* Project section */}
//                 <h1 className="text-4xl font-semibold  mb-4 text-center my-6">{!isDeveloper ? 'Created Projects' : 'Assigned Projects'}</h1>
//                 {loading ? (
//                     <div className="flex justify-center">
//                         <FallingLines
//                             color="blue"
//                             height={100}
//                             width={100}
//                         />
//                     </div>
//                 ) : (
//                     projects.length === 0 ? (
//                         <p className="text-center p-8">No projects found</p>
//                     ) : (
//                         <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                             {projects.map(project => {
//                                 const projectData = project;
//                                 return (
//                                     <div key={project._id} className="bg-white shadow-md rounded-md p-4">
//                                         {/* Basic Info - Always Visible */}
//                                         <h4 className="text-lg font-semibold mb-2 cursor-pointer"
//                                             onClick={() => setExpandedProject(expandedProject === project._id ? null : project._id)}>
//                                             {projectData.projectName} ↓
//                                         </h4>

//                                         {isDeveloper && projectData.feedback && projectData.feedback.length > 0 && (
//                                             <div className="mb-4">
//                                                 {projectData.feedback.map((fb, idx) => {
//                                                     if (fb.userId === currentUser.email) {
//                                                         return (
//                                                             <div key={idx}>
//                                                                 <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
//                                                                     ${!fb.status ? 'bg-yellow-100 text-yellow-800' :
//                                                                     fb.status === 'approved' ? 'bg-green-100 text-green-800' :
//                                                                     'bg-red-100 text-red-800'}`}>
//                                                                     {!fb.status ? 'Pending Approval' :
//                                                                     fb.status === 'approved' ? 'Approved - Ready for Test 2' :
//                                                                     'Submission Rejected'}
//                                                                 </div>
                                                                
//                                                                 {/* Show action message based on status */}
//                                                                 {fb.status === 'approved' && (
//                                                                     <div className="mt-3">
//                                                                         {interviewFeedback[project._id] ? (
//                                                                             <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md mt-2">
//                                                                                 <p className="font-medium">AI Interview Completed</p>
//                                                                                 <p className="text-sm">Round 2 done. Awaiting final results from the Project Manager.</p>
//                                                                             </div>
//                                                                         ) : (
//                                                                             <>
//                                                                                 <p className="text-green-700 mb-2">
//                                                                                     Congratulations! You've been accepted for the second round.
//                                                                                 </p>
//                                                                                 <button 
//                                                                                     onClick={() => startAIInterview(project)}
//                                                                                     className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
//                                                                                 >
//                                                                                     Start AI Interview
//                                                                                 </button>
//                                                                             </>
//                                                                         )}
//                                                                     </div>
//                                                                 )}
                                                                
//                                                                 {fb.status === 'rejected' && (
//                                                                     <div className="mt-3">
//                                                                         <p className="text-red-700">
//                                                                             Unfortunately, you were not selected for the second round.
//                                                                         </p>
//                                                                     </div>
//                                                                 )}
//                                                             </div>
//                                                         );
//                                                     }
//                                                     return null;
//                                                 })}
//                                             </div>
//                                         )}

//                                         {/* Expandable Details */}
//                                         {expandedProject === project._id && (
//                                             <div className="mt-4 space-y-2">
//                                                 <p className="text-sm text-700">{projectData.description}</p>
//                                                 <p className="text-sm text-700">
//                                                     <strong>Technologies:</strong> {projectData.technologies.join(', ')}
//                                                 </p>
//                                                 <p className="text-sm text-700"><strong>Level:</strong> {projectData.level}</p>
//                                                 <p className="text-sm text-700"><strong>Duration:</strong> {projectData.duration}</p>
//                                                 <p className="text-sm text-700"><strong>Budget:</strong> {projectData.money}</p>
                                                
//                                                 {/* Feedback Section */}
//                                                 {projectData.feedback && projectData.feedback.length > 0 && (
//                                                     <div className="mt-4">
//                                                         <button 
//                                                             onClick={() => setShowFeedback(showFeedback === project._id ? null : project._id)}
//                                                             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
//                                                         >
//                                                             {showFeedback === project._id ? 'Hide Feedback' : 'View Feedback'}
//                                                         </button>
                                                        
//                                                         {showFeedback === project._id && (
//                                                             <div className="mt-4 p-4 bg-gray-50 rounded-md">
//                                                                 {projectData.feedback.map((fb, idx) => (
//                                                                     <div key={idx} className="mb-4">
//                                                                         <p><strong>Grade:</strong> {fb.grade}/10</p>
//                                                                         <p><strong>Feedback:</strong></p>
//                                                                         <p className="whitespace-pre-line text-sm">
//                                                                             {fb.user_feedback}
//                                                                         </p>
//                                                                     </div>
//                                                                 ))}
//                                                             </div>
//                                                         )}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         )}
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     )
//                 )}
                
//                 {/* AI Interview Modal */}
//                 {showInterviewModal && selectedInterviewProject && (
//                     <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
//                         <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
//                             <h3 className="text-xl font-bold mb-4">AI Technical Interview for {selectedInterviewProject.projectName}</h3>
//                             <p className="mb-4">
//                                 You're about to start a technical AI interview for this project. The AI will ask you questions related to 
//                                 the technologies and requirements of this project.
//                             </p>
//                             <p className="mb-6">
//                                 This interview will help assess your technical knowledge and problem-solving skills.
//                             </p>
                            
//                             <div className="flex justify-end space-x-4">
//                                 <button 
//                                     onClick={() => setShowInterviewModal(false)}
//                                     className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
//                                 >
//                                     Cancel
//                                 </button>
//                                 <button 
//                                     onClick={() => {
//                                         setShowInterviewModal(false);
//                                         // Redirect to the interview page with project ID
//                                         navigate(`/ai-interview/${selectedInterviewProject._id}`);
//                                     }}
//                                     className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
//                                 >
//                                     Start Interview
//                                 </button>
//                             </div>
//                         </div>
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// };

// export default Profile;


import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import Axios
import { useAuth } from '../../contexts/authContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { FallingLines } from 'react-loader-spinner';
import Select from 'react-select';
import Navbar from '../Navbar';

const Profile = () => {
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
        { value: 'Others', label: 'Others' },
    ];

    const [expandedProject, setExpandedProject] = useState(null);
    const [showFeedback, setShowFeedback] = useState(null);
    const [showInterviewModal, setShowInterviewModal] = useState(false);
    const [selectedInterviewProject, setSelectedInterviewProject] = useState(null);
    const [interviewFeedback, setInterviewFeedback] = useState({});
    const [interviewStatus, setInterviewStatus] = useState({});

    const { currentUser, isDeveloper, isProjectManager } = useAuth();
    const [userData, setUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        github: '',
        linkedin: '',
        techStack: [],
    });
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Function to fetch user data from the backend
    const fetchUserData = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/freelancer/developers/${currentUser.email}`);
            setUserData(response.data);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    // Function to fetch interview feedback for a project
    const fetchInterviewFeedback = async (projectId, developerEmail) => {
        try {
            const response = await axios.get(`http://localhost:3000/PM/projects/${projectId}/interview-feedback/${developerEmail}`);
            
            if (response.data.length > 0) {
                // Get the latest feedback (should be the last element in the array)
                const latestFeedback = response.data[response.data.length - 1];
                
                // Store status if it exists
                if (latestFeedback.status) {
                    setInterviewStatus(prev => ({
                        ...prev,
                        [projectId]: latestFeedback.status
                    }));
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error fetching interview feedback:', error);
            return false;
        }
    };

    // Function to fetch projects data from the backend based on user role
    const fetchProjects = async () => {
        try {
            let response;
            if (isDeveloper) {
                response = await axios.get(`http://localhost:3000/freelancer/developers/${currentUser.email}/projects`);

                // For each project that has feedback with approved status, check if interview feedback exists
                const projectsWithInterviewStatus = await Promise.all(
                    response.data.map(async (project) => {
                        if (project.feedback && project.feedback.length > 0) {
                            const userFeedback = project.feedback.find(fb => fb.userId === currentUser.email);
                            if (userFeedback && userFeedback.status === 'approved') {
                                const hasInterviewFeedback = await fetchInterviewFeedback(project._id, currentUser.email);
                                setInterviewFeedback(prev => ({
                                    ...prev,
                                    [project._id]: hasInterviewFeedback
                                }));
                            }
                        }
                        return project;
                    })
                );
                setProjects(response.data);
            } else if (isProjectManager) {
                response = await axios.get(`http://localhost:3000/PM/projects/created/${currentUser.email}`);
                setProjects(response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setLoading(false);
        }
    };

    // Function to save changes to the backend
    const saveChanges = async () => {
        try {
            await axios.post(`http://localhost:3000/freelancer/developers/${currentUser.email}`,
                {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    github: userData.github,
                    linkedin: userData.linkedin,
                    techStack: userData.techStack,
                }
            );
            console.log('User data updated successfully');
        } catch (error) {
            console.error('Error updating user data: ', error);
        }
    };

    // Function to handle profile photo selection
    const handleProfilePhotoChange = (e) => {
        const file = e.target.files[0];
        setUserData({ ...userData, profilePhoto: file });
    };

    // Function to handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData({ ...userData, [name]: value });
    };

    // Function to handle tech stack selection
    const handleTechStackChange = (selectedOptions) => {
        setUserData({
            ...userData,
            techStack: selectedOptions.map(option => option.value)
        });
    };

    // Function to start AI interview
    const startAIInterview = (project) => {
        setSelectedInterviewProject(project);
        setShowInterviewModal(true);
    };

    useEffect(() => {
        if (currentUser) {
            fetchProjects();
        }
    }, [currentUser, isDeveloper, isProjectManager]);

    if (!currentUser) {
        navigate('/login');
        return null;
    }

    // Helper function to render status based on interview results
    const renderInterviewStatus = (projectId) => {
        const status = interviewStatus[projectId];
        
        if (status === 'hired') {
            return (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md mt-2">
                    <p className="font-medium">Congratulations! 🎉</p>
                    <p className="text-sm">You've been selected for this project!</p>
                </div>
            );
        } else if (status === 'rejected') {
            return (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mt-2">
                    <p className="font-medium">Thank you for your interest</p>
                    <p className="text-sm">Unfortunately, you were not selected for this project.</p>
                </div>
            );
        } else if (interviewFeedback[projectId]) {
            return (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-md mt-2">
                    <p className="font-medium">AI Interview Completed</p>
                    <p className="text-sm">Round 2 done. Awaiting final results from the Project Manager.</p>
                </div>
            );
        }
        
        return null;
    };

    return (
        <div>
            <div>
                <Navbar />
            </div>
            <div className="container grid my-8 mx-auto mt-10 ">
                {/* Project section */}
                <h1 className="text-4xl font-semibold  mb-4 text-center my-6">{!isDeveloper ? 'Created Projects' : 'Assigned Projects'}</h1>
                {loading ? (
                    <div className="flex justify-center">
                        <FallingLines
                            color="blue"
                            height={100}
                            width={100}
                        />
                    </div>
                ) : (
                    projects.length === 0 ? (
                        <p className="text-center p-8">No projects found</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {projects.map(project => {
                                const projectData = project;
                                return (
                                    <div key={project._id} className="bg-white shadow-md rounded-md p-4">
                                        {/* Basic Info - Always Visible */}
                                        <h4 className="text-lg font-semibold mb-2 cursor-pointer"
                                            onClick={() => setExpandedProject(expandedProject === project._id ? null : project._id)}>
                                            {projectData.projectName} ↓
                                        </h4>

                                        {isDeveloper && projectData.feedback && projectData.feedback.length > 0 && (
                                            <div className="mb-4">
                                                {projectData.feedback.map((fb, idx) => {
                                                    if (fb.userId === currentUser.email) {
                                                        return (
                                                            <div key={idx}>
                                                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                                                                    ${!fb.status ? 'bg-yellow-100 text-yellow-800' :
                                                                    fb.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                    'bg-red-100 text-red-800'}`}>
                                                                    {!fb.status ? 'Pending Approval' :
                                                                    fb.status === 'approved' ? 'Approved - Ready for Test 2' :
                                                                    'Submission Rejected'}
                                                                </div>
                                                                
                                                                {/* Show action message based on status */}
                                                                {fb.status === 'approved' && (
                                                                    <div className="mt-3">
                                                                        {/* Render appropriate status message */}
                                                                        {renderInterviewStatus(project._id) || (
                                                                            <>
                                                                                <p className="text-green-700 mb-2">
                                                                                    Congratulations! You've been accepted for the second round.
                                                                                </p>
                                                                                <button 
                                                                                    onClick={() => startAIInterview(project)}
                                                                                    className="bg-blue-500 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded"
                                                                                >
                                                                                    Start AI Interview
                                                                                </button>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                
                                                                {fb.status === 'rejected' && (
                                                                    <div className="mt-3">
                                                                        <p className="text-red-700">
                                                                            Unfortunately, you were not selected for the second round.
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        )}

                                        {/* Expandable Details */}
                                        {expandedProject === project._id && (
                                            <div className="mt-4 space-y-2">
                                                <p className="text-sm text-700">{projectData.description}</p>
                                                <p className="text-sm text-700">
                                                    <strong>Technologies:</strong> {projectData.technologies.join(', ')}
                                                </p>
                                                <p className="text-sm text-700"><strong>Level:</strong> {projectData.level}</p>
                                                <p className="text-sm text-700"><strong>Duration:</strong> {projectData.duration}</p>
                                                <p className="text-sm text-700"><strong>Budget:</strong> {projectData.money}</p>
                                                
                                                {/* Feedback Section */}
                                                {projectData.feedback && projectData.feedback.length > 0 && (
                                                    <div className="mt-4">
                                                        <button 
                                                            onClick={() => setShowFeedback(showFeedback === project._id ? null : project._id)}
                                                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                                        >
                                                            {showFeedback === project._id ? 'Hide Feedback' : 'View Feedback'}
                                                        </button>
                                                        
                                                        {showFeedback === project._id && (
                                                            <div className="mt-4 p-4 bg-gray-50 rounded-md">
                                                                {projectData.feedback.map((fb, idx) => (
                                                                    <div key={idx} className="mb-4">
                                                                        <p><strong>Grade:</strong> {fb.grade}/10</p>
                                                                        <p><strong>Feedback:</strong></p>
                                                                        <p className="whitespace-pre-line text-sm">
                                                                            {fb.user_feedback}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
                
                {/* AI Interview Modal */}
                {showInterviewModal && selectedInterviewProject && (
                    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
                            <h3 className="text-xl font-bold mb-4">AI Technical Interview for {selectedInterviewProject.projectName}</h3>
                            <p className="mb-4">
                                You're about to start a technical AI interview for this project. The AI will ask you questions related to 
                                the technologies and requirements of this project.
                            </p>
                            <p className="mb-6">
                                This interview will help assess your technical knowledge and problem-solving skills.
                            </p>
                            
                            <div className="flex justify-end space-x-4">
                                <button 
                                    onClick={() => setShowInterviewModal(false)}
                                    className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        setShowInterviewModal(false);
                                        // Redirect to the interview page with project ID
                                        navigate(`/ai-interview/${selectedInterviewProject._id}`);
                                    }}
                                    className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded"
                                >
                                    Start Interview
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;