const request = require("supertest");
const chai = require("chai");
const expect = chai.expect;
const app = require("../server");
const agent = request.agent(app); // persist session for login

describe("FoodLens API - Automated Testing of Public GET Endpoints", () => {

  before(() => {
    console.log("\nStarting FoodLens API Tests...\n");
  });

  after(() => {
    console.log("\n***** All tests executed. *****\n");
  });

  describe("1. Food Insecurity Types Endpoint", () => {
    it("GET /api/type should return labels and values arrays", (done) => {
      console.log("\nTesting /api/type...");
      request(app)
        .get("/api/type")
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Response from /api/type:", res.body);
          expect(res.body).to.have.property("labels").that.is.an("array");
          expect(res.body).to.have.property("values").that.is.an("array");
          done();
        });
    });
  });

  describe("2. Demographics Visualization Endpoint", () => {
    it("GET /api/demographics?year=2023 should return non-empty labels and values arrays", (done) => {
      console.log("\nTesting /api/demographics?year=2023...");
      request(app)
        .get("/api/demographics?year=2023")
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Response from /api/demographics:", res.body);
          expect(res.body.labels).to.be.an("array").that.is.not.empty;
          expect(res.body.values).to.be.an("array").that.is.not.empty;
          done();
        });
    });
  });

  describe("3. Combined Trends Endpoint", () => {
    it("GET /api/trends/values?category=gender should return a non-empty values array", (done) => {
      console.log("\nTesting /api/trends/values?category=gender...");
      request(app)
        .get("/api/trends/values?category=gender")
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Response from /api/trends/values:", res.body);
          expect(res.body.values).to.be.an("array").that.is.not.empty;
          done();
        });
    });
  });

  describe("4. Prediction Endpoint", () => {
    it("GET /api/predict?category=gender&group=Female should return prediction structure", (done) => {
      console.log("\nTesting /api/predict?category=gender&group=Female...");
      request(app)
        .get("/api/predict?category=gender&group=Female")
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Response from /api/predict:", res.body);
          expect(res.body).to.have.keys(["years", "actual", "predicted", "splitIndex"]);
          expect(res.body.actual).to.be.an("array");
          expect(res.body.predicted).to.be.an("array");
          done();
        });
    });
  });

  describe("5. Insights Endpoint", () => {
    it("GET /api/insight?category=gender&group=Female should return insight data", (done) => {
      console.log("\nTesting /api/insight?category=gender&group=Female...");
      request(app)
        .get("/api/insight?category=gender&group=Female")
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Response from /api/insight:", res.body);
          expect(res.body).to.have.property("years");
          expect(res.body).to.have.property("datasets").that.is.an("array");
          done();
        });
    });
  });

  // ---------------------
  // Login before protected route tests
  // ---------------------
  before((done) => {
    console.log("\nLogging in before protected route tests...");
    agent
      .post("/login")
      .type("form")
      .send({ username: "adminuser", password: "adminpassword123" }) 
      .expect(res => {
        if (res.status !== 302 && res.status !== 200) {
          throw new Error("Login failed or did not redirect");
        }
      })
      .end((err, res) => {
        if (err) return done(err);
        console.log("Login cookie:", res.headers["set-cookie"]);
        done();
      });
  });

  // ------------------------
  // Save Chart Filters Test
  // ------------------------
  describe("6. Save Filters Endpoint (Insight - Gender: Female)", () => {
    it("POST /api/user/filters should save filters and return success message", (done) => {
      console.log("\nTesting /api/user/filters [POST]...");
      agent
        .post("/api/user/filters")
        .set("Content-Type", "application/json")
        .send({
          chart: "insight",
          filters: {
            category: "gender",
            group: "Female"
          }
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Response from POST /api/user/filters:", res.body);
          expect(res.body).to.have.property("message").that.includes("Filters saved");
          done();
        });
    });
  });

  // ------------------------
  // Get Saved Filters Test
  // ------------------------
  describe("7. Get Saved Filters Endpoint (Insight)", () => {
    it("GET /api/user/filters?chart=insight should return saved filter data", (done) => {
      console.log("\nTesting /api/user/filters?chart=insight [GET]...");
      agent
        .get("/api/user/filters?chart=insight")
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Response from GET /api/user/filters:", res.body);
          expect(res.body).to.have.property("filters");
          expect(res.body.filters).to.have.property("category", "gender");
          expect(res.body.filters).to.have.property("group", "Female");
          done();
        });
    });
  });

  // ------------------------
  // Admin CSV Export Test
  // ------------------------
  describe("8. Admin CSV Export", () => {
    it("GET /admin/export-csv should return a CSV file", (done) => {
      console.log("\nTesting /admin/export-csv [GET]...");
      agent
        .get("/admin/export-csv")
        .expect(200)
        .expect("Content-Type", /text\/csv/)
        .end((err, res) => {
          if (err) return done(err);
          console.log("CSV Export Response:\n", res.text.slice(0, 200), "...");
          expect(res.text).to.include("Username,Role,Last Chart,Filters");
          done();
        });
    });
  });

  // ------------------------
  // Admin Toggle Role Test
  // ------------------------
  /*test3*/
  testUserId = '6835467a39a4aba67b52283f'

  describe("9. Admin Toggle Role", () => {
    it("POST /admin/toggle-role should change a user's role", (done) => {
      console.log("\nTesting /admin/toggle-role [POST]...");
      agent
        .post("/admin/toggle-role")
        .set("Accept", "application/json")
        .send({ userId: testUserId })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Toggle Role Response:", res.body);
          expect(res.body).to.have.property("message", "Role Updated");
          expect(res.body).to.have.property("newRole").that.is.oneOf(["admin", "user"]);
          done();
        });
    });
  });

  // ------------------------
  // Admin Clear History Test
  // ------------------------
  describe("10. Admin Clear User History", () => {
    it("POST /admin/clear-history should redirect after clearing history", (done) => {
      console.log("\nTesting /admin/clear-user-history [POST]...");
      agent
        .post("/admin/clear-user-history")
        .send({ userId: testUserId })
        .expect(302)
        .expect("Location", /\/admin-panel/)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Clear History redirected to:", res.header.location);
          done();
        });
    });
  });

  // ------------------------
  // Admin Delete User Test
  // ------------------------
  describe("11. Admin Delete User", () => {
    it("POST /admin/delete-user should redirect after deleting user", (done) => {
      console.log("\nTesting /admin/delete-user [POST]...");
      agent
        .post("/admin/delete-user")
        .send({ userId: '68354a9539a4aba67b522a62' }) /*test10 <- user*/
        .expect(302)
        .expect("Location", /\/admin-panel/)
        .end((err, res) => {
          if (err) return done(err);
          console.log("Delete User redirected to:", res.header.location);
          done();
        });
    });
  });
});
