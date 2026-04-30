import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test("renders login page when no token exists", () => {
  localStorage.removeItem("token");
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/sign in to view deo bernal's portfolio/i)).toBeInTheDocument();
});
