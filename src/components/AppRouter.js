import React, { useContext } from "react";
import {Routes, Route, Navigate} from "react-router-dom";
import { Context } from "../index";
import { authRoutes, publicRoutes } from "../routes";
import AuthChecker from "../pages/AuthChecker"
import { observer } from "mobx-react-lite"

const AppRouter = () => {
    const {user} = useContext(Context)
    return (
      <Routes>
        {user.IsAuth && authRoutes.map(({path, Component}) => 
          <Route key={path} path={path} Component={Component} exact />
          )}
        {publicRoutes.map(({path, Component}) => 
          <Route key={path} path={path} Component={Component} exact/>
          )}
          <Route path="*" element={<AuthChecker />} />
      </Routes>
    );
};

export default observer(AppRouter);
