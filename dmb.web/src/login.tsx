import { useState, type FormEvent } from "react";
import Alert from "react-bootstrap/Alert";
import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import api from "./services/http.service";

type LoginProps = {
  onLoginSuccess: (token: string) => void;
};

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const login = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post<{ token: string }>("/auth/login", {
        username,
        password,
      });
      onLoginSuccess(res.data.token);
    } catch (error: any) {
      if (!error?.response) {
        setError("Unable to reach API. Check API URL and backend status.");
      } else {
        setError("Invalid username or password.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await login();
  };

  return (
    <Container fluid="lg" className="min-vh-100 d-flex align-items-center py-4 px-3">
      <Row className="justify-content-center w-100" style={{ marginTop: "-7vh" }}>
        <Col xs={12} sm={10} md={8} lg={5} xl={4}>
          <Card className="shadow-sm">
            <Card.Body className="p-4">
              <Card.Title as="h1" className="h3 mb-4 text-center">
                Sign in to view Deo Bernal's Portfolio
              </Card.Title>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="login-username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    autoComplete="username"
                    disabled={submitting}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="login-password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    disabled={submitting}
                  />
                </Form.Group>
                <div className="d-grid">
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? "Signing in..." : "Login"}
                  </Button>
                </div>
              </Form>
              {error ? (
                <Alert variant="danger" className="mt-3 mb-0" role="alert">
                  {error}
                </Alert>
              ) : null}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
