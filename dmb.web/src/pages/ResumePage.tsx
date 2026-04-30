import Card from "react-bootstrap/Card";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

export default function ResumePage() {
  return (
    <Container fluid="lg" className="py-4 py-md-5 px-3">
      <Row className="justify-content-center">
        <Col xl={10}>
          <Card className="shadow-sm">
            <Card.Body>
              <h1 className="h3 mb-3">Resume</h1>
              <p className="mb-2">
                Professional summary, work experience, education, and certifications can be
                presented here.
              </p>
              <p className="mb-0 text-muted">
                This page is ready for your full resume content and downloadable CV link.
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
