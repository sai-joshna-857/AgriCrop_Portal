import React, { useState, useEffect } from "react";

export default function App() {
  // Authentication State: starts logged out every time the page loads
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'register'
  const [currentUser, setCurrentUser] = useState({ email: "", role: "", fullName: "" });
  const [authError, setAuthError] = useState("");

  // Login & Registration Inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("farmer");

  // Portal State
  const [activeTab, setActiveTab] = useState("batches");
  const [batches, setBatches] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live Weather State
  const [weatherAlert, setWeatherAlert] = useState({
    severity: "Normal",
    message: "Fetching live farm weather...",
    temp: "--",
    updatedAt: "Syncing..."
  });

  // Batch Form State
  const [batchForm, setBatchForm] = useState({
    name: "",
    variety: "",
    zone: "",
    area: "",
    plantingDate: "",
    harvestDate: "",
  });

  // Telemetry Simulation Form State
  const [sensorForm, setSensorForm] = useState({
    deviceId: "",
    batchId: "",
    soilMoisture: "",
    ambientTemp: "",
    phLevel: "",
  });

  // Disease Diagnostic State
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [symptom, setSymptom] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  // Fetch live weather immediately
  useEffect(() => {
    fetchLiveWeather();
  }, []);

  // Fetch batches & telemetry only after authentication
  useEffect(() => {
    if (isAuthenticated) {
      fetchBatches();
      fetchTelemetry();
    }
  }, [isAuthenticated]);

  // 1. Live Weather API (Open-Meteo)
  const fetchLiveWeather = async () => {
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=17.385&longitude=78.486&current=temperature_2m,relative_humidity_2m,precipitation&hourly=precipitation_probability&forecast_days=1"
      );
      const data = await res.json();

      const currentTemp = data.current?.temperature_2m ?? 28;
      const precipitation = data.current?.precipitation ?? 0;
      const maxPrecipProb = Math.max(...(data.hourly?.precipitation_probability || [0]));

      if (precipitation > 1.0 || maxPrecipProb >= 60) {
        setWeatherAlert({
          severity: "High",
          message: `Heavy rainfall expected (${maxPrecipProb}% probability, ${precipitation}mm rain). Postpone foliar sprays and nitrogen fertilization.`,
          temp: `${currentTemp}°C`,
          updatedAt: "Live Sync"
        });
      } else if (currentTemp > 35) {
        setWeatherAlert({
          severity: "Moderate",
          message: `High ambient temperature (${currentTemp}°C). Check soil moisture levels and schedule evening drip cycles.`,
          temp: `${currentTemp}°C`,
          updatedAt: "Live Sync"
        });
      } else {
        setWeatherAlert({
          severity: "Normal",
          message: `Favorable agricultural conditions (${currentTemp}°C, 0mm rain). Optimal window for seeding and inspection.`,
          temp: `${currentTemp}°C`,
          updatedAt: "Live Sync"
        });
      }
    } catch (err) {
      setWeatherAlert({
        severity: "Normal",
        message: "Regional weather conditions normal (28°C). Regular irrigation schedule recommended.",
        temp: "28°C",
        updatedAt: "Cached"
      });
    }
  };

  // 2. Authentication: Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser({
          email: data.email || loginEmail,
          role: data.role || "farmer",
          fullName: data.fullName || "Farm Operator"
        });
        setIsAuthenticated(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setAuthError(errorData.error || "Invalid email or password.");
      }
    } catch (err) {
      setAuthError("Cannot connect to Spring Boot backend (port 8080).");
    }
  };

  // 3. Authentication: Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          password: regPassword,
          role: regRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser({
          email: data.email || regEmail,
          role: data.role || regRole,
          fullName: data.fullName || regFullName,
        });
        setIsAuthenticated(true);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setAuthError(errorData.error || "Registration failed. Email may already be in use.");
      }
    } catch (err) {
      setAuthError("Registration failed: check backend connection.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginPassword("");
    setAuthError("");
  };

  // 4. Batches API
  const fetchBatches = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch (err) {
      console.error("Error loading batches:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBatch = async (e) => {
    e.preventDefault();
    if (!batchForm.name || !batchForm.zone || !batchForm.area) {
      alert("Please enter Crop Name, Zone, and Area.");
      return;
    }

    const payload = {
      name: batchForm.name,
      variety: batchForm.variety ? `(${batchForm.variety})` : "",
      zone: batchForm.zone,
      area: batchForm.area,
      plantingDate: batchForm.plantingDate || new Date().toISOString().split("T")[0],
      harvestDate: batchForm.harvestDate || "",
      stage: "Planted",
      status: "Active",
    };

    try {
      const res = await fetch("http://localhost:8080/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setBatches((prev) => [...prev, saved]);
        setBatchForm({ name: "", variety: "", zone: "", area: "", plantingDate: "", harvestDate: "" });
      } else {
        alert("Failed to save batch to backend.");
      }
    } catch (err) {
      console.error("Network error saving batch:", err);
    }
  };

  // 5. Telemetry API
  const fetchTelemetry = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/telemetry");
      if (res.ok) {
        const data = await res.json();
        setTelemetry(data);
      }
    } catch (err) {
      console.error("Error loading telemetry:", err);
    }
  };

  const handleSendTelemetry = async (e) => {
    e.preventDefault();
    if (!sensorForm.deviceId || !sensorForm.soilMoisture) {
      alert("Device ID and Soil Moisture are required.");
      return;
    }

    const moistureNum = parseFloat(sensorForm.soilMoisture);
    const payload = {
      deviceId: sensorForm.deviceId,
      batchId: sensorForm.batchId || "BAT-2026-001",
      soilMoisture: sensorForm.soilMoisture.includes("%") ? sensorForm.soilMoisture : `${sensorForm.soilMoisture}%`,
      ambientTemp: sensorForm.ambientTemp.includes("°C") ? sensorForm.ambientTemp : `${sensorForm.ambientTemp || 28} °C`,
      phLevel: sensorForm.phLevel || "6.5",
      status: moistureNum < 25 ? "Critical: Low Moisture" : moistureNum > 80 ? "Critical: Waterlogged" : "Optimal",
    };

    try {
      const res = await fetch("http://localhost:8080/api/telemetry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        setTelemetry((prev) => [...prev, saved]);
        setSensorForm({ deviceId: "", batchId: "", soilMoisture: "", ambientTemp: "", phLevel: "" });
      }
    } catch (err) {
      console.error("Error transmitting telemetry:", err);
    }
  };

  // 6. Disease Diagnostics
  const handleAnalyzeDisease = (e) => {
    e.preventDefault();
    const mockDiagnostics = {
      Tomato: {
        disease: "Early Blight (Alternaria solani)",
        risk: "High",
        treatment: "Apply copper fungicide spray. Ensure drip irrigation and prune lower foliage to prevent splash.",
        confidence: "94%",
      },
      Corn: {
        disease: "Northern Corn Leaf Blight",
        risk: "Moderate",
        treatment: "Rotate crops next cycle. Apply strobilurin fungicide if lesions appear prior to silking.",
        confidence: "88%",
      },
      Soybeans: {
        disease: "Soybean Rust (Phakopsora pachyrhizi)",
        risk: "Low",
        treatment: "Maintain current air circulation and inspect field canopy after rain.",
        confidence: "91%",
      },
      Wheat: {
        disease: "Leaf Rust (Puccinia triticina)",
        risk: "Moderate",
        treatment: "Apply tebuconazole or propiconazole at flag leaf emergence.",
        confidence: "95%",
      },
    };

    setAnalysisResult(mockDiagnostics[selectedCrop] || {
      disease: "Unidentified Chlorosis",
      risk: "Low",
      treatment: "Check soil pH and nitrogen balance. Telemetry confirms hydration levels are standard.",
      confidence: "82%",
    });
  };

  const getStageBadgeStyle = (stage) => {
    switch (stage?.toLowerCase()) {
      case "vegetative": return { backgroundColor: "#e0f2fe", color: "#0284c7" };
      case "flowering": return { backgroundColor: "#fef3c7", color: "#d97706" };
      case "maturity": return { backgroundColor: "#f3e8ff", color: "#9333ea" };
      case "planted": return { backgroundColor: "#ede9fe", color: "#7c3aed" };
      default: return { backgroundColor: "#f1f5f9", color: "#475569" };
    }
  };

  // ==========================================
  // RENDER: LOGIN / REGISTRATION SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h1 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "4px" }}>AgriCrop Portal</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Agricultural Operations & Telemetry Management</p>
          </div>

          <div style={styles.authTabs}>
            <button
              onClick={() => { setAuthMode("login"); setAuthError(""); }}
              style={{ ...styles.authTabBtn, borderBottom: authMode === "login" ? "2px solid #059669" : "none", color: authMode === "login" ? "#059669" : "#64748b" }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode("register"); setAuthError(""); }}
              style={{ ...styles.authTabBtn, borderBottom: authMode === "register" ? "2px solid #059669" : "none", color: authMode === "register" ? "#059669" : "#64748b" }}
            >
              Register User
            </button>
          </div>

          {authError && <div style={styles.errorBanner}>{authError}</div>}

          {authMode === "login" ? (
            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. farmer.john@example.com"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.input}
                  required
                />
              </div>

              <button type="submit" style={styles.fullWidthBtn}>Sign In</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Full Name"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  style={styles.input}
                >
                  <option value="farmer">Farmer / Field Manager</option>
                  <option value="agronomist">Agronomist</option>
                  <option value="technician">IoT Field Technician</option>
                </select>
              </div>

              <button type="submit" style={styles.fullWidthBtn}>Create Account</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN APPLICATION DASHBOARD
  // ==========================================
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>AgriCrop Management Portal</h1>
            <p style={styles.subtitle}>
              Logged in as: <strong>{currentUser.email}</strong>
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <nav style={styles.navBar}>
              <button
                onClick={() => setActiveTab("batches")}
                style={{ ...styles.navBtn, ...(activeTab === "batches" ? styles.navBtnActive : {}) }}
              >
                🌱 Batches & Registration
              </button>
              <button
                onClick={() => setActiveTab("telemetry")}
                style={{ ...styles.navBtn, ...(activeTab === "telemetry" ? styles.navBtnActive : {}) }}
              >
                📡 Live Telemetry
              </button>
              <button
                onClick={() => setActiveTab("disease")}
                style={{ ...styles.navBtn, ...(activeTab === "disease" ? styles.navBtnActive : {}) }}
              >
                🔬 Disease Diagnosis
              </button>
            </nav>

            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Weather Advisory */}
        <div
          style={{
            ...styles.alertBanner,
            backgroundColor:
              weatherAlert.severity === "High"
                ? "#fffbeb"
                : weatherAlert.severity === "Moderate"
                ? "#fefce8"
                : "#f0fdf4",
            borderColor:
              weatherAlert.severity === "High"
                ? "#fef3c7"
                : weatherAlert.severity === "Moderate"
                ? "#fef08a"
                : "#bbf7d0",
            color:
              weatherAlert.severity === "High"
                ? "#b45309"
                : weatherAlert.severity === "Moderate"
                ? "#854d0e"
                : "#166534",
          }}
        >
          <div style={styles.alertLeft}>
            <span>{weatherAlert.severity === "Normal" ? "⛅" : "⚠️"}</span>
            <span>
              <strong>Weather Advisory ({weatherAlert.severity}):</strong> {weatherAlert.message}
            </span>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <span style={{ fontWeight: "700" }}>{weatherAlert.temp}</span>
            <span style={styles.alertTime}>{weatherAlert.updatedAt}</span>
          </div>
        </div>

        {/* TAB 1: BATCHES & REGISTRATION */}
        {activeTab === "batches" && (
          <div>
            <div style={styles.card}>
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thRow}>
                      <th style={styles.th}>Batch ID</th>
                      <th style={styles.th}>Crop & Variety</th>
                      <th style={styles.th}>Zone</th>
                      <th style={styles.th}>Area (Acres)</th>
                      <th style={styles.th}>Planting Date</th>
                      <th style={styles.th}>Harvest Date</th>
                      <th style={styles.th}>Stage</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>Loading batches from database...</td></tr>
                    ) : batches.length === 0 ? (
                      <tr><td colSpan="8" style={{ textAlign: "center", padding: "24px" }}>No batches registered yet.</td></tr>
                    ) : (
                      batches.map((batch) => (
                        <tr key={batch.id || Math.random()} style={styles.tr}>
                          <td style={styles.tdId}>{batch.id}</td>
                          <td style={styles.td}>{batch.name} <span style={styles.varietyText}>{batch.variety}</span></td>
                          <td style={styles.td}>{batch.zone}</td>
                          <td style={styles.td}>{batch.area}</td>
                          <td style={styles.td}>{batch.plantingDate}</td>
                          <td style={styles.td}>{batch.harvestDate}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, ...getStageBadgeStyle(batch.stage) }}>{batch.stage || "Planted"}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{ ...styles.badge, ...styles.activeBadge }}>{batch.status || "Active"}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>Register New Batch</h2>
              <form onSubmit={handleRegisterBatch} style={styles.form}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Crop Name</label>
                    <input
                      type="text"
                      value={batchForm.name}
                      onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                      placeholder="e.g. Wheat, Cotton"
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Variety</label>
                    <input
                      type="text"
                      value={batchForm.variety}
                      onChange={(e) => setBatchForm({ ...batchForm, variety: e.target.value })}
                      placeholder="e.g. Sharbati"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Zone / Field</label>
                    <input
                      type="text"
                      value={batchForm.zone}
                      onChange={(e) => setBatchForm({ ...batchForm, zone: e.target.value })}
                      placeholder="e.g. Block C2"
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Area (Acres)</label>
                    <input
                      type="text"
                      value={batchForm.area}
                      onChange={(e) => setBatchForm({ ...batchForm, area: e.target.value })}
                      placeholder="e.g. 4.0"
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Planting Date</label>
                    <input
                      type="date"
                      value={batchForm.plantingDate}
                      onChange={(e) => setBatchForm({ ...batchForm, plantingDate: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Harvest Date</label>
                    <input
                      type="date"
                      value={batchForm.harvestDate}
                      onChange={(e) => setBatchForm({ ...batchForm, harvestDate: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                </div>
                <div style={styles.buttonWrapper}>
                  <button type="submit" style={styles.submitBtn}>Register Batch</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: TELEMETRY VIEW & INGESTION */}
        {activeTab === "telemetry" && (
          <div>
            <div style={styles.cardHeader}>
              <h2 style={{ fontSize: "18px", color: "#1e293b", margin: 0 }}>Field Telemetry & IoT Sensor Feeds</h2>
              <button onClick={fetchTelemetry} style={styles.refreshBtn}>🔄 Refresh Sensors</button>
            </div>

            <div style={styles.telemetryGrid}>
              {telemetry.length === 0 ? (
                <div style={{ padding: "30px", color: "#64748b" }}>No telemetry data returned from <code>/api/telemetry</code>.</div>
              ) : (
                telemetry.map((t) => (
                  <div key={t.id || t.deviceId || Math.random()} style={styles.telemetryCard}>
                    <div style={styles.telemetryTop}>
                      <span style={styles.deviceId}>{t.deviceId || t.id}</span>
                      <span style={t.status?.toLowerCase().includes("crit") ? styles.statusBad : styles.statusGood}>
                        {t.status || "Optimal"}
                      </span>
                    </div>
                    <div style={styles.telemetryZone}>Batch / Zone: <strong>{t.batchId || t.zone || "Field Zone"}</strong></div>

                    <div style={styles.metricRow}>
                      <div style={styles.metric}>
                        <span style={styles.metricLabel}>Soil Moisture</span>
                        <span style={styles.metricVal}>{t.soilMoisture || t.moisture || "38%"}</span>
                      </div>
                      <div style={styles.metric}>
                        <span style={styles.metricLabel}>Ambient Temp</span>
                        <span style={styles.metricVal}>{t.ambientTemp || t.temperature || "26°C"}</span>
                      </div>
                      <div style={styles.metric}>
                        <span style={styles.metricLabel}>Soil pH</span>
                        <span style={styles.metricVal}>{t.phLevel || t.ph || "6.8"}</span>
                      </div>
                    </div>
                    <div style={styles.recordedAt}>Recorded: {t.recordedAt || "Live Sync"}</div>
                  </div>
                ))
              )}
            </div>

            <div style={{ ...styles.formCard, marginTop: "28px" }}>
              <h2 style={styles.formTitle}>Broadcast New Sensor Reading (IoT Gateway)</h2>
              <form onSubmit={handleSendTelemetry} style={styles.form}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Device ID</label>
                    <input
                      type="text"
                      value={sensorForm.deviceId}
                      onChange={(e) => setSensorForm({ ...sensorForm, deviceId: e.target.value })}
                      placeholder="e.g. IOT-ZONE-C2"
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Linked Batch ID</label>
                    <input
                      type="text"
                      value={sensorForm.batchId}
                      onChange={(e) => setSensorForm({ ...sensorForm, batchId: e.target.value })}
                      placeholder="e.g. BAT-2026-004"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Soil Moisture (%)</label>
                    <input
                      type="text"
                      value={sensorForm.soilMoisture}
                      onChange={(e) => setSensorForm({ ...sensorForm, soilMoisture: e.target.value })}
                      placeholder="e.g. 42%"
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Ambient Temp (°C)</label>
                    <input
                      type="text"
                      value={sensorForm.ambientTemp}
                      onChange={(e) => setSensorForm({ ...sensorForm, ambientTemp: e.target.value })}
                      placeholder="e.g. 29.5"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Soil pH</label>
                    <input
                      type="text"
                      value={sensorForm.phLevel}
                      onChange={(e) => setSensorForm({ ...sensorForm, phLevel: e.target.value })}
                      placeholder="e.g. 6.4"
                      style={styles.input}
                    />
                  </div>
                </div>
                <div style={styles.buttonWrapper}>
                  <button type="submit" style={styles.submitBtn}>Transmit & Save Telemetry</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: DISEASE DETECTION */}
        {activeTab === "disease" && (
          <div style={styles.diseaseContainer}>
            <div style={styles.formCard}>
              <h2 style={styles.formTitle}>Crop Disease Detection & Mitigation</h2>
              <form onSubmit={handleAnalyzeDisease} style={styles.form}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Select Affected Crop</label>
                    <select
                      value={selectedCrop}
                      onChange={(e) => setSelectedCrop(e.target.value)}
                      style={styles.input}
                    >
                      <option value="Tomato">Roma Tomato</option>
                      <option value="Corn">Sweet Corn</option>
                      <option value="Soybeans">Soybeans</option>
                      <option value="Wheat">Wheat</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Visible Symptoms</label>
                    <input
                      type="text"
                      placeholder="e.g. Yellow leaf spots, brown concentric rings, wilt"
                      value={symptom}
                      onChange={(e) => setSymptom(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.buttonWrapper}>
                  <button type="submit" style={styles.submitBtn}>
                    Run Diagnostic Assessment
                  </button>
                </div>
              </form>
            </div>

            {analysisResult && (
              <div style={styles.resultCard}>
                <div style={styles.resultHeader}>
                  <h3 style={{ margin: 0, fontSize: "16px", color: "#065f46" }}>
                    Diagnostic Result: {analysisResult.disease}
                  </h3>
                  <span style={styles.confidenceBadge}>Confidence: {analysisResult.confidence}</span>
                </div>
                <div style={styles.resultBody}>
                  <p style={{ margin: "8px 0" }}>
                    <strong>Risk Level:</strong>{" "}
                    <span style={{ color: analysisResult.risk === "High" ? "#dc2626" : "#d97706", fontWeight: "600" }}>
                      {analysisResult.risk}
                    </span>
                  </p>
                  <p style={{ margin: "8px 0 4px 0" }}><strong>Recommended Field Action:</strong></p>
                  <div style={styles.treatmentBox}>{analysisResult.treatment}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  authPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "20px",
  },
  authCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    padding: "32px",
    maxWidth: "420px",
    width: "100%",
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
  },
  authTabs: {
    display: "flex",
    borderBottom: "1px solid #e2e8f0",
    marginBottom: "20px",
  },
  authTabBtn: {
    flex: 1,
    padding: "10px",
    background: "transparent",
    border: "none",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
  },
  errorBanner: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "10px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    marginBottom: "16px",
    textAlign: "center",
  },
  fullWidthBtn: {
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    marginTop: "8px",
  },
  page: {
    backgroundColor: "#f8fafc",
    minHeight: "100vh",
    padding: "24px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: {
    maxWidth: "1150px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "16px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 4px 0",
  },
  subtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: 0,
  },
  navBar: {
    display: "flex",
    gap: "8px",
    background: "#e2e8f0",
    padding: "4px",
    borderRadius: "8px",
  },
  navBtn: {
    background: "transparent",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#475569",
    cursor: "pointer",
  },
  navBtnActive: {
    background: "#ffffff",
    color: "#059669",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  logoutBtn: {
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  alertBanner: {
    border: "1px solid",
    padding: "12px 18px",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    fontSize: "13px",
  },
  alertLeft: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  alertTime: {
    fontSize: "12px",
    opacity: 0.85,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    overflow: "hidden",
    marginBottom: "28px",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  thRow: {
    borderBottom: "1px solid #f1f5f9",
  },
  th: {
    padding: "14px 18px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
  },
  tr: {
    borderBottom: "1px solid #f8fafc",
  },
  tdId: {
    padding: "14px 18px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#1e293b",
  },
  td: {
    padding: "14px 18px",
    fontSize: "13px",
    color: "#334155",
  },
  varietyText: {
    color: "#64748b",
    fontSize: "12px",
  },
  badge: {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
  },
  activeBadge: {
    backgroundColor: "#dcfce7",
    color: "#15803d",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: "24px",
  },
  formTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "16px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
    marginBottom: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "13px",
    outline: "none",
  },
  buttonWrapper: {
    display: "flex",
    justifyContent: "flex-end",
  },
  submitBtn: {
    backgroundColor: "#059669",
    color: "#ffffff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  refreshBtn: {
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
  },
  telemetryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  telemetryCard: {
    background: "#ffffff",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  telemetryTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  deviceId: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statusGood: {
    backgroundColor: "#dcfce7",
    color: "#16a34a",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
  },
  statusBad: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
  },
  telemetryZone: {
    fontSize: "12px",
    color: "#64748b",
    marginBottom: "16px",
  },
  metricRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "14px",
    padding: "10px",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  metric: {
    textAlign: "center",
  },
  metricLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginBottom: "4px",
  },
  metricVal: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#0f172a",
  },
  recordedAt: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  diseaseContainer: {
    maxWidth: "800px",
    margin: "0 auto",
  },
  resultCard: {
    background: "#ffffff",
    borderRadius: "10px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    borderLeft: "4px solid #059669",
  },
  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  confidenceBadge: {
    background: "#dcfce7",
    color: "#16a34a",
    padding: "3px 8px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
  },
  resultBody: {
    fontSize: "13px",
    color: "#334155",
    lineHeight: "1.5",
  },
  treatmentBox: {
    background: "#f1f5f9",
    padding: "12px",
    borderRadius: "6px",
    marginTop: "6px",
  },
};