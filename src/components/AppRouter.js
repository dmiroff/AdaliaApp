import React, { useContext } from "react";
import {Routes, Route, Navigate} from "react-router-dom";
import { Context } from "../index";
import { authRoutes, publicRoutes } from "../routes";

const AppRouter = () => {
    const {user} = useContext(Context)
    //const isAuth = true;
    //
    return (
      <Routes>
        {user.IsAuth && authRoutes.map(({path, Component}) => 
          <Route key={path} path={path} Component={Component} exact/>
          )}
        {publicRoutes.map(({path, Component}) => 
          <Route key={path} path={path} Component={Component} exact/>
          )}
          <Route path="*" element={<Navigate replace to="/rating" />} />
      </Routes>
    );
};

export default AppRouter;