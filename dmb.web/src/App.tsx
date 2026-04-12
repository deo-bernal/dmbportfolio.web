import { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import api from "./api/client";

type ProjectItem = {
  name: string;
  description: string;
};

type ProjectCategory = {
  title: string;
  items: ProjectItem[];
};

type Contact = {
  email: string;
  phone: string;
};

type Profile = {
  name: string;
  summary: string;
  video: string;
  skills: string[];
  projectCategories: ProjectCategory[];
  contact: Contact;
};

type AppProps = {
  onLogout: () => void;
};

function App({ onLogout }: AppProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // Still clear the session locally if the request fails (e.g. offline).
    } finally {
      setLoggingOut(false);
      onLogout();
    }
  };

  useEffect(() => {
    api.get<Profile>("/profile").then((res) => setProfile(res.data));
  }, []);

  if (!profile) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs="auto" className="text-center text-muted">
            Loading...
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-3 pe-5">
      <div
        className="position-fixed top-0 end-0 d-flex flex-column align-items-end p-3"
        style={{ zIndex: 1040 }}
      >
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? "Signing out..." : "Log out"}
        </button>
      </div>

      <header className="mb-4 pe-5">
        <Row>
          <Col>
            <h1 className="mb-0 fs-4 fs-md-3">{profile.name}</h1>
          </Col>
        </Row>
      </header>

      <Row className="mb-3">
        <Col className="text-start">
          <a
            className="link-primary fw-bold fs-5 d-inline-block"
            href={profile.video}
            target="_blank"
            rel="noopener noreferrer"
          >
            Intro video
          </a>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <p className="lead mb-0">{profile.summary}</p>
        </Col>
      </Row>

      <Row className="mb-2">
        <Col>
          <h2 className="h4">Skills</h2>
        </Col>
      </Row>
      <Row className="mb-4">
        <Col>
          <ul className="mb-0">
            {profile.skills.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Col>
      </Row>

      <Row className="mb-2">
        <Col>
          <h2 className="h4">Projects</h2>
        </Col>
      </Row>
      {profile.projectCategories.map((category, i) => (
        <Row key={i} className="mb-4">
          <Col>
            <section>
              <h3 className="h5 mb-3">{category.title}</h3>
              <ul className="mb-0 ps-3">
                {category.items.map((item, j) => (
                  <li key={j} className="mb-2">
                    <strong>{item.name}</strong>
                    {" \u2013 "}
                    <span>{item.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          </Col>
        </Row>
      ))}

      <Row>
        <Col>
          <section className="border-top pt-4 mt-2">
            <h2 className="h4">Contact</h2>
            <p className="mb-2">
              <strong>Email:</strong>{" "}
              <a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a>
            </p>
            <p className="mb-0">
              <strong>Phone:</strong>{" "}
              <a href={`tel:${profile.contact.phone.replace(/\s/g, "")}`}>
                {profile.contact.phone}
              </a>
            </p>
          </section>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
