import { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Collapse from "react-bootstrap/Collapse";
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

type ApiUser = {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  contactNo?: string | null;
  activated: boolean;
  createdAt: string;
  userDetails?: ApiUserDetails | null;
  projects: ApiProject[];
};

type ApiUserDetails = {
  userId: number;
  description?: string | null;
  skills?: string | null;
  video?: string | null;
};

type ApiProject = {
  userId: number;
  name: string;
  type: string;
  projectDetails?: string | null;
};

type AppProps = {
  onLogout: () => void;
};

function mapProfileDetailsToProfile(primaryUser: ApiUser): Profile {
  const details = primaryUser.userDetails;

  const parsedSkills = (details?.skills ?? "")
    .split(/[,\n;]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  const groupedProjects = (primaryUser.projects ?? [])
    .reduce<ProjectCategory[]>((categories, project) => {
      const categoryTitle = (project.type || "Other").trim() || "Other";
      const existingCategory = categories.find(
        (category) => category.title === categoryTitle
      );

      const item: ProjectItem = {
        name: project.name,
        description: project.projectDetails ?? "",
      };

      if (existingCategory) {
        existingCategory.items.push(item);
        return categories;
      }

      categories.push({ title: categoryTitle, items: [item] });
      return categories;
    }, []);

  return {
    name: [primaryUser.firstName, primaryUser.lastName].filter(Boolean).join(" ") || "Profile",
    summary: details?.description ?? "",
    video: details?.video ?? "",
    skills: parsedSkills,
    projectCategories: groupedProjects,
    contact: {
      email: primaryUser.email ?? "",
      phone: primaryUser.contactNo ?? "",
    },
  };
}

function App({ onLogout }: AppProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const hasFetchedProfile = useRef(false);
  const visibleSkills = profile?.skills.slice(0, 11) ?? [];
  const hiddenSkills = profile?.skills.slice(11) ?? [];
  const visibleProjectCategories = profile?.projectCategories.slice(0, 2) ?? [];
  const hiddenProjectCategories = profile?.projectCategories.slice(2) ?? [];

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
    if (hasFetchedProfile.current) {
      return;
    }
    hasFetchedProfile.current = true;

    api
      .get<ApiUser>("/profiledetails")
      .then((res) => {
        setProfile(mapProfileDetailsToProfile(res.data));
        setLoadError(null);
      })
      .catch((error) => {
        if (error?.response?.status === 401) {
          onLogout();
          return;
        }
        setLoadError("Unable to load profile details.");
      });
  }, [onLogout]);

  if (!profile) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col xs="auto" className="text-center text-muted">
            {loadError ?? "Loading..."}
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid="lg" className="py-4 py-md-5 px-3">
      <Row className="mb-4 justify-content-center">
        <Col xl={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <header className="mb-3 d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <h1 className="mb-0 fs-4 fs-md-3" data-testid="profile-name">{profile.name}</h1>
                  <div className="d-flex align-items-center gap-2" aria-label="Built with React and .NET">
                    <img
                      src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"
                      alt="React logo"
                      width={28}
                      height={28}
                    />
                    <span className="text-muted fw-semibold">+</span>
                    <img
                      src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dotnetcore/dotnetcore-original.svg"
                      alt=".NET logo"
                      width={28}
                      height={28}
                    />
                  </div>
                </div>
                <Button variant="outline-secondary" onClick={handleLogout} disabled={loggingOut}>
                  {loggingOut ? "Signing out..." : "Log out"}
                </Button>
              </header>
              {profile.video ? (
                <a
                  className="link-primary fw-bold fs-5 d-inline-block mb-3"
                  href={profile.video}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Intro video
                </a>
              ) : null}
              <p className="lead mb-0">{profile.summary}</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4 justify-content-center">
        <Col xl={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="h4 mb-3">Skills</h2>
              <ul className="mb-0">
                {visibleSkills.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              {hiddenSkills.length > 0 ? (
                <>
                  <Collapse in={showAllSkills}>
                    <div>
                      <ul className="mt-2 mb-0">
                        {hiddenSkills.map((s, i) => (
                          <li key={`hidden-${i}`}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  </Collapse>
                  <Button
                    variant="link"
                    className="px-0 mt-2 text-decoration-none"
                    onClick={() => setShowAllSkills((prev) => !prev)}
                    aria-expanded={showAllSkills}
                  >
                    {showAllSkills ? "Hide skills ▲" : "Show all skills ▼"}
                  </Button>
                </>
              ) : null}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4 justify-content-center">
        <Col xl={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="h4 mb-3">Projects</h2>
              {visibleProjectCategories.map((category, i) => (
                <section key={i} className={i === visibleProjectCategories.length - 1 ? "" : "mb-4"}>
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
              ))}
              {hiddenProjectCategories.length > 0 ? (
                <>
                  <Collapse in={showAllProjects}>
                    <div className="mt-4">
                      {hiddenProjectCategories.map((category, i) => (
                        <section
                          key={`hidden-${i}`}
                          className={i === hiddenProjectCategories.length - 1 ? "" : "mb-4"}
                        >
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
                      ))}
                    </div>
                  </Collapse>
                  <Button
                    variant="link"
                    className="px-0 mt-2 text-decoration-none"
                    onClick={() => setShowAllProjects((prev) => !prev)}
                    aria-expanded={showAllProjects}
                  >
                    {showAllProjects ? "Hide projects ▲" : "Show all projects ▼"}
                  </Button>
                </>
              ) : null}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="justify-content-center">
        <Col xl={10}>
          <Card className="shadow-sm">
            <Card.Body>
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
