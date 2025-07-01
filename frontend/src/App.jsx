// import Login from "./components/auth/login/login";
// import Register from "./components/auth/register/register";


// import Dashboard from "./components/dashboard/dashboard";
// import DevHome from "./components/developer-home-page/DevHome";
// import AdminDashboard from "./components/admin-dashboard/AdminDashboard";

// import { AuthProvider } from "./contexts/authContext";
// import { useRoutes } from "react-router-dom";
// import Home from "./Home";
// import Profile from "./components/profile/profile";

// function App() {
//   const routesArray = [
//     {
//       path: "/",
//       element: <Home />,
//     },
//     {
//       path: "/login",
//       element: <Login />,
//     },
//     {
//       path: "/register",
//       element: <Register />,
//     },
//     {
//       path: "/dashboard",
//       element: <Dashboard />,
//     },
//     {
//       path: "/home",
//       element: <DevHome />,
//     },
//     {
//       path: "/profile",
//       element: <Profile />,
//     },
//     {
//       path: "/admin",
//       element: <AdminDashboard />,
//     },
//   ];
//   let routesElement = useRoutes(routesArray);
//   return (
//     <AuthProvider>
//       {/* <Header /> */}
//       <div className="w-full h-screen flex flex-col">{routesElement}</div>
//     </AuthProvider>
//   );
// }

// export default App;

import Login from "./components/auth/login/login";
import Register from "./components/auth/register/register";
import Dashboard from "./components/dashboard/dashboard";
import DevHome from "./components/developer-home-page/DevHome";
import AdminDashboard from "./components/admin-dashboard/AdminDashboard";
import AIInterview from "./components/ai-interview/AIinterview"; // Import the AI interview component

import { AuthProvider } from "./contexts/authContext";
import { useRoutes } from "react-router-dom";
import Home from "./Home";
import Profile from "./components/profile/profile";

function App() {
  const routesArray = [
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/home",
      element: <DevHome />,
    },
    {
      path: "/profile",
      element: <Profile />,
    },
    {
      path: "/admin",
      element: <AdminDashboard />,
    },
    {
      path: "/ai-interview/:projectId", // Dynamic route with projectId parameter
      element: <AIInterview />,
    },
  ];
  let routesElement = useRoutes(routesArray);
  return (
    <AuthProvider>
      {/* <Header /> */}
      <div className="w-full h-screen flex flex-col">{routesElement}</div>
    </AuthProvider>
  );
}

export default App;