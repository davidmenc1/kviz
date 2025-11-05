"use client";

import { useTRPC } from "@/trpc";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";

export default function QuizPrintPage() {
  const params = useParams();
  const quizId = params.id as string;
  const trpc = useTRPC();

  const quizQuery = useQuery({
    ...trpc.quiz.getQuiz.queryOptions({ id: quizId }),
    enabled: !!quizId,
  });

  const questionsQuery = useQuery({
    ...trpc.question.getQuestions.queryOptions({ quizId }),
    enabled: !!quizId,
  });

  if (questionsQuery.isLoading || quizQuery.isLoading) {
    return <div>Loading...</div>;
  }

  if (questionsQuery.error || quizQuery.error) {
    return (
      <div className="text-destructive">
        Error: {questionsQuery.error?.message || quizQuery.error?.message}
      </div>
    );
  }

  const quiz = quizQuery.data;
  const questions =
    questionsQuery.data?.sort((a, b) => a.order - b.order) || [];

  return (
    <>
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print-container {
            padding: 0;
          }
          .no-print {
            display: none;
          }
        }
        @media screen {
          .print-container {
            background: white;
            min-height: 100vh;
          }
        }
        .question {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .question-number {
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .question-text {
          font-size: 14px;
          margin-bottom: 12px;
          line-height: 1.5;
        }
        .options {
          margin-left: 20px;
        }
        .option {
          margin-bottom: 8px;
          font-size: 13px;
          line-height: 1.4;
        }
        .option-correct {
          font-weight: bold;
          color: #059669;
        }
        .option-correct::before {
          content: "✓ ";
        }
        .quiz-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          text-align: center;
        }
        .quiz-description {
          text-align: center;
          margin-bottom: 30px;
          color: #666;
          font-size: 14px;
        }
      `}</style>
      <div
        className="print-container"
        style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}
      >
        <div
          className="no-print"
          style={{ marginBottom: "20px", textAlign: "center" }}
        >
          <button
            onClick={() => window.print()}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Print
          </button>
        </div>

        {quiz && (
          <>
            <h1 className="quiz-title">{quiz.name}</h1>
            {quiz.description && (
              <p className="quiz-description">{quiz.description}</p>
            )}
          </>
        )}

        {questions.map((question, index) => (
          <div key={question.id} className="question">
            <div className="question-number">
              Question {index + 1} (Order: {question.order})
            </div>
            <div className="question-text">{question.text}</div>
            <div className="options">
              {question.options.length === 0 ? (
                <div
                  className="option"
                  style={{ fontStyle: "italic", color: "#999" }}
                >
                  No options available
                </div>
              ) : (
                question.options.map((option, optIndex) => (
                  <div
                    key={option.id}
                    className={`option ${option.isCorrect ? "option-correct" : ""}`}
                  >
                    {String.fromCharCode(65 + optIndex)}. {option.text}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}

        {questions.length === 0 && (
          <div
            style={{ textAlign: "center", color: "#999", marginTop: "50px" }}
          >
            No questions available for this quiz.
          </div>
        )}
      </div>
    </>
  );
}
