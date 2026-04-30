import { combineReducers } from "@reduxjs/toolkit";
import { reducer as userReducer } from "../slices/user";

const rootReducer = combineReducers({
  user: userReducer,
});

export default rootReducer;
