import { NavLink, Outlet } from "react-router-dom";
import Container from "react-bootstrap/Container";

export default function AccentSidebarLayout() {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <aside className="bg-dark text-white p-3" style={{ width: 240 }}>
        <div className="fw-semibold mb-3">DMB Portfolio</div>
        <div className="d-flex flex-column gap-2">
          <NavLink
            to="/accent-sidebar/portfolio"
            end
            className={({ isActive }: { isActive: boolean }) =>
              `px-2 rounded text-white text-decoration-none ${isActive ? "bg-primary fw-semibold" : ""}`
            }
          >
            Portfolio
          </NavLink>
          <NavLink
            to="/accent-sidebar/resume"
            className={({ isActive }: { isActive: boolean }) =>
              `px-2 rounded text-white text-decoration-none ${isActive ? "bg-primary fw-semibold" : ""}`
            }
          >
            Resume
          </NavLink>
        </div>
      </aside>
      <main className="flex-grow-1">
        <Container fluid="lg" className="py-3">
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
