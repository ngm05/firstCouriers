import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import App from "./App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NewJobForm from "./pages/NewJobForm.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Dashboard />} />
          <Route path="new-job" element={<NewJobForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
