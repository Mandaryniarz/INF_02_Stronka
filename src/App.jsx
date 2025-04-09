import React, { useState, useEffect } from "react";

function App() {
  const [data, setData] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [progress, setProgress] = useState({});
  const [mode, setMode] = useState(null);
  const [currentUser, setCurrentUser] = useState("");

  useEffect(() => {
    fetch("/dzial_1_wirtualizacja.json")
      .then((res) => res.json())
      .then((json) => setData(json));
  }, []);

  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem("progress_" + currentUser);
      setProgress(saved ? JSON.parse(saved) : {});
    }
  }, [currentUser]);

  const handleLogin = () => {
    const user = prompt("Podaj swoje imię lub identyfikator:");
    if (user) setCurrentUser(user);
  };

  const saveProgress = (updated) => {
    localStorage.setItem("progress_" + currentUser, JSON.stringify(updated));
  };

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers({ ...answers, [questionIndex]: answerIndex });
  };

  const handleSubmit = () => {
    const correct = selectedTopic.pytania.reduce((acc, pytanie, idx) => {
      return acc + (answers[idx] === pytanie.poprawna[0] ? 1 : 0);
    }, 0);
    const percentage = Math.round((correct / selectedTopic.pytania.length) * 100);
    setScore(percentage);
    setSubmitted(true);
    const updated = { ...progress, [selectedTopic.id]: percentage };
    setProgress(updated);
    saveProgress(updated);
  };

  const resetTopic = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
    setSelectedTopic(null);
  };

  const isUnlocked = (index) => {
    if (index === 0) return true;
    const previousId = data.tematy[index - 1].id;
    return progress[previousId] >= 95;
  };

  if (!data) return <p className="p-4">Ładowanie danych...</p>;

  if (!mode) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">INF.02 - Edukacja</h1>
        <p className="mb-4">Wybierz tryb:</p>
        <button className="bg-blue-600 text-white px-4 py-2 mr-4" onClick={() => setMode("student")}>
          Jestem uczniem
        </button>
        <button className="bg-green-600 text-white px-4 py-2" onClick={() => setMode("teacher")}>
          Jestem nauczycielem
        </button>
      </div>
    );
  }

  if (mode === "teacher") {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold">{data.dzial}</h1><button className="text-sm text-blue-600 underline ml-4" onClick={() => setMode(null)}>← Wróć do menu głównego</button></div>
        <h2 className="text-xl font-semibold mb-2">Postępy uczniów:</h2>
        {Object.keys(localStorage)
          .filter((key) => key.startsWith("progress_"))
          .map((key) => {
            const student = key.replace("progress_", "");
            const data = JSON.parse(localStorage.getItem(key));
            return (
              <div key={key} className="mb-3 border-b pb-2">
                <p className="font-medium">{student}</p>
                <ul className="list-disc ml-5">
                  {Object.entries(data).map(([id, val]) => (
                    <li key={id}>
                      Temat {id}: {val}%
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-4">
        <button className="bg-blue-600 text-white px-4 py-2 mr-2" onClick={handleLogin}>
          Zaloguj się jako uczeń
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4"><h1 className="text-2xl font-bold">{data.dzial}</h1><button className="text-sm text-blue-600 underline ml-4" onClick={() => setMode(null)}>← Wróć do menu głównego</button></div>
      {!selectedTopic ? (
        <ul className="space-y-2">
          {data.tematy.map((temat, index) => {
            const unlocked = isUnlocked(index);
            const wynik = progress[temat.id];
            return (
              <li key={temat.id}>
                <button
                  className={`underline ${unlocked ? "text-blue-600" : "text-gray-400 cursor-not-allowed"}`}
                  onClick={() => unlocked && setSelectedTopic(temat)}
                  disabled={!unlocked}
                >
                  {temat.id} – {temat.tytul} {wynik !== undefined ? `(Wynik: ${wynik}%)` : ""}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div>
          <button className="text-sm text-gray-600 underline mb-2" onClick={resetTopic}>
            ← Wróć do listy tematów
          </button>
          <h2 className="text-xl font-semibold mb-2">{selectedTopic.tytul}</h2>
          <p className="mb-4">{selectedTopic.lekcja}</p>
          <h3 className="text-lg font-medium mb-2">Pytania kontrolne:</h3>
          <ul className="space-y-3">
            {selectedTopic.pytania.map((pytanie, index) => (
              <li key={index}>
                <p className="font-medium">{pytanie.pytanie}</p>
                <ul className="list-none ml-5">
                  {pytanie.odpowiedzi.map((odp, idx) => (
                    <li key={idx}>
                      <label>
                        <input
                          type="radio"
                          name={`pytanie-${index}`}
                          value={idx}
                          disabled={submitted}
                          checked={answers[index] === idx}
                          onChange={() => handleAnswerChange(index, idx)}
                        />{" "}
                        {odp}
                      </label>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          {!submitted ? (
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSubmit}>
              Zakończ temat
            </button>
          ) : (
            <div className="mt-4">
              <p className="text-lg font-semibold">Twój wynik: {score}%</p>
              <button className="mt-2 px-4 py-1 text-sm bg-gray-300 rounded" onClick={resetTopic}>
                Wróć do listy tematów
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
