import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";

test("renders login page when no token exists", () => {
  localStorage.removeItem("token");
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
  expect(screen.getByText(/sign in to view your portfolio/i)).toBeInTheDocument();
});
