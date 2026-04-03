import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { formatTime } from "../utils/algorithms";
import { useAuth } from "../context/AuthContext";

const DEFAULT_QUESTION_COUNT = 20;

export default function QuizPage() {
  const { topicId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { updateScore } = useAuth();

  const [phase, setPhase] = useState("loading");
  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState(state?.topic || null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState("");

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const answersRef = useRef([]);
  const autoNextTimeoutRef = useRef(null);

  // Fetch quiz
  const startQuiz = useCallback(async () => {
    setPhase("loading");
    setError("");
    setAnswers([]);
    answersRef.current = [];
    setCurrent(0);

    try {
      const { data } = await api.post("/quiz/start", {
        topicId,
        count: DEFAULT_QUESTION_COUNT,
      });

      setQuestions(data.questions);
      setTopic(data.topic);
      
      const limit = Math.ceil(data.questions.length / 5) * 120;
      setTimeLeft(limit);
      
      setPhase("ready");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load quiz.");
      setPhase("error");
    }
  }, [topicId]);

  useEffect(() => { startQuiz(); }, [startQuiz]);

  // Global Timer
  useEffect(() => {
    if (phase !== "question") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          submitQuiz(); 
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleSelect = (optIndex) => {
    if (revealed || phase !== "question") return;

    const q = questions[current];
    const timeTaken = Math.round((Date.now() - startTimeRef.current) / 1000);

    setSelected(optIndex);
    setRevealed(true);

    const newAnswer = {
      questionId: q._id,
      selectedOption: optIndex,
      timedOut: false,
      timeTakenSeconds: timeTaken,
    };

    const updatedAnswers = [...answersRef.current, newAnswer];
    answersRef.current = updatedAnswers;
    setAnswers(updatedAnswers);

    autoNextTimeoutRef.current = setTimeout(() => {
      handleNext(updatedAnswers);
    }, 1200);
  };

  const handleNext = (currentAnswers = answersRef.current) => {
    if (autoNextTimeoutRef.current) {
      clearTimeout(autoNextTimeoutRef.current);
      autoNextTimeoutRef.current = null;
    }

    if (current + 1 >= questions.length) {
      submitQuiz(currentAnswers);
    } else {
      setSelected(null);
      setRevealed(false);
      setCurrent((c) => c + 1);
      startTimeRef.current = Date.now(); 
    }
  };

  const submitQuiz = async (finalAnswers = answersRef.current) => {
    if (phase === "submitting") return;
    setPhase("submitting");
    clearInterval(timerRef.current);

    try {
      const limit = Math.ceil(questions.length / 5) * 120;
      const totalTimeTaken = limit - timeLeft;

      const { data } = await api.post("/quiz/submit", {
        topicId,
        answers: finalAnswers,
        timeTakenSeconds: totalTimeTaken,
      });

      updateScore(data.newTotalScore);
      navigate("/results", { state: { result: data, topic, questions, totalTimeTaken } });
    } catch (err) {
      setError("Failed to submit quiz.");
      setPhase("question");
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (phase === "ready" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        startTimeRef.current = Date.now();
        setPhase("question");
        return;
      }

      if (phase !== "question") return;

      if (revealed) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "a") handleSelect(0);
      else if (key === "b") handleSelect(1);
      else if (key === "c") handleSelect(2);
      else if (key === "d") handleSelect(3);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [phase, revealed, questions, current]);

  // UI states
  if (phase === "loading" || phase === "submitting") {
    return (
      <div className="container center" style={{ marginTop: "10rem" }}>
        <div className="spinner"></div>
        <p style={{ color: "var(--text-2)", marginTop: "1rem" }}>
          {phase === "loading" ? "Preparing your quiz..." : "Calculating your score..."}
        </p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="container center" style={{ marginTop: "10rem" }}>
        <div className="card" style={{ maxWidth: 400, margin: "0 auto" }}>
          <h2 style={{ color: "var(--error)", marginBottom: "1rem" }}>Oops!</h2>
          <p style={{ marginBottom: "1.5rem" }}>{error}</p>
          <button className="btn btn-primary" onClick={startQuiz}>Try Again</button>
        </div>
      </div>
    );
  }

  if (phase === "ready") {
    const limit = Math.ceil(questions.length / 5) * 120;
    return (
      <div className="container center" style={{ marginTop: "10rem" }}>
        <div className="card fade-in" style={{ maxWidth: 500, margin: "0 auto", padding: "3rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚡</div>
          <h1 style={{ marginBottom: "0.5rem" }}>{topic?.name}</h1>
          <p style={{ color: "var(--text-2)", marginBottom: "2rem" }}>
            {questions.length} Questions • {formatTime(limit)} Limit
          </p>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "1rem" }}
            onClick={() => {
              startTimeRef.current = Date.now();
              setPhase("question");
            }}
          >
            Start Quiz (Enter)
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;
  
  let timerColor = "var(--text-2)";
  let timerClass = "";
  if (timeLeft < 10) {
    timerColor = "var(--error)";
    timerClass = "timer-pulse";
  } else if (timeLeft < 30) {
    timerColor = "var(--warning)";
  }

  return (
    <div className="container main-content">
      <div className="card quiz-card-enter" style={{ position: "relative", overflow: "hidden" }}>
        
        <div style={{ 
          position: "absolute", top: 0, left: 0, width: "100%", height: 4, 
          background: "var(--bg-3)" 
        }}>
          <div style={{ 
            width: `${progress}%`, height: "100%", background: "var(--accent)",
            transition: "width 0.3s ease"
          }}></div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", marginTop: "0.5rem" }}>
          <div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Question {current + 1} of {questions.length}
            </div>
            {questions.length <= 10 && (
              <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                {questions.map((_, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: i < current ? "var(--accent)" : i === current ? "var(--accent-2)" : "var(--bg-3)",
                    transition: "all 0.3s ease"
                  }} />
                ))}
              </div>
            )}
          </div>
          
          <div className={timerClass} style={{ 
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.25rem", 
            color: timerColor, background: "var(--bg-3)", padding: "0.5rem 1rem", borderRadius: "var(--radius-sm)"
          }}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <h2 style={{ marginBottom: "2rem", lineHeight: 1.4 }}>{q.text}</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect  = revealed && i === q.correctAnswer;
            const isWrong    = revealed && isSelected && !isCorrect;

            let borderColor = "var(--border)";
            let background = "var(--bg-3)";
            let color = "var(--text)";
            
            if (isCorrect) {
              borderColor = "var(--success)";
              background = "rgba(34, 197, 94, 0.1)";
              color = "var(--success)";
            } else if (isWrong) {
              borderColor = "var(--error)";
              background = "rgba(239, 68, 68, 0.1)";
              color = "var(--error)";
            } else if (isSelected && !revealed) {
              borderColor = "var(--accent)";
              background = "var(--accent-glow)";
            }

            return (
              <button
                key={i}
                className="option-stagger"
                onClick={() => handleSelect(i)}
                disabled={revealed}
                style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "1.1rem 1.5rem", borderRadius: "var(--radius-sm)",
                  border: `1px solid ${borderColor}`, background, color,
                  textAlign: "left", fontSize: "1rem", transition: "all 0.2s ease",
                  animationDelay: `${i * 0.05}s`, position: "relative"
                }}
              >
                <span style={{ 
                  width: 28, height: 28, borderRadius: "6px", background: "rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.8rem", fontWeight: 700, border: "1px solid var(--border)"
                }}>
                  {["A", "B", "C", "D"][i]}
                </span>
                
                <span style={{ flex: 1 }}>{opt}</span>
                
                {isCorrect && <span style={{ fontSize: "1.2rem" }}>✅</span>}
                {isWrong && <span style={{ fontSize: "1.2rem" }}>❌</span>}
                
                {!revealed && (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 700 }}>
                    [{["A", "B", "C", "D"][i]}]
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {revealed && q.explanation && (
          <div className="fade-in" style={{ 
            marginTop: "2rem", padding: "1rem", borderRadius: "var(--radius-sm)",
            background: "rgba(124, 92, 252, 0.05)", border: "1px dashed var(--accent-glow)",
            fontSize: "0.9rem", color: "var(--text-2)", lineHeight: 1.5
          }}>
            💡 <strong>Explanation:</strong> {q.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
