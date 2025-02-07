import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "../common/Header";

export const Pages = () => {
    return (
        <Router>
            <Header />
            <Routes>
            </Routes>
        </Router>
    );
};
