"use client";

import { useState, useEffect } from "react";
import { QuizCard } from "../../components/QuizCard";
import { QuizTimer } from "../../components/QuizTimer";
import { QuizComplete } from "../../components/QuizComplete";
import { Button } from "../../components/ui/button";
import { getLoggedInUser } from "@/appwrite/config";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getQuiz, updateQuiz, updateUser, validate } from "@/actions/quiz";

const QUESTION_TIME = 180;
const MAX_POINTS = 100;

export interface Question {
  id: string;
  text: string;
  options: string[];
  // correct:string;
  isAnswered: boolean;
  isCorrect: boolean;
}

export default function Home() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [id, setId] = useState<string>();
  useEffect(() => {
    getLoggedInUser().then((user) => {
      if (!user) router.push("/login");
      setId(user?.$id);
    });
    getQuiz().then((data) => {
      if (data) {
        setQuestions(data.quiz);
        setScore(data.points);
      } else alert("Something went wrong");
    });
  }, []);
  const imageArray = [
    // Array of image paths

    "/img/processed_image.png",
    "/img/miles.png",
    "/img/blackspider.png",
  ];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Function to change the image
  const changeImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % imageArray.length);
  };

  useEffect(() => {
    if (!quizComplete && !isAnswered && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isAnswered, quizComplete]);

  useEffect(() => {
    if (timeLeft === 0 && !isAnswered) {
      handleNextQuestion();
    }
  }, [timeLeft]);

  const calculatePoints = (timeRemaining: number) => {
    return Math.round((timeRemaining / QUESTION_TIME) * MAX_POINTS);
  };

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption) {
      setIsAnswered(true);
      validate(questions[currentQuestion].id, selectedOption).then((data) => {
        if (data.error) {
          return alert("Error");
        }
        if (data.correct) {
          setScore((prev) => prev + calculatePoints(timeLeft));
          updateUser(
            questions[currentQuestion].id,
            { isAnswered: true, isCorrect: true },
            id!,
            score
          );
          setQuestions((prev) => {
            const quiz = prev.map((q, i) =>
              i == currentQuestion
                ? {
                    text: questions[currentQuestion].text,
                    options: questions[currentQuestion].options,
                    isCorrect: true,
                    isAnswered: true,
                    id: questions[currentQuestion].id,
                  }
                : q
            );
            return quiz;
          });
          toast.success("Correct Answer");
        } else {
          setScore((prev) =>prev<5 ? 0 : prev - 5);
          updateUser(
            questions[currentQuestion].id,
            { isAnswered: true, isCorrect: false },
            id!,
            score
          );
          setQuestions((prev) => {
            const quiz = prev.map((q, i) =>
              i == currentQuestion
                ? {
                    text: questions[currentQuestion].text,
                    options: questions[currentQuestion].options,
                    isCorrect: false,
                    isAnswered: true,
                    id: questions[currentQuestion].id,
                  }
                : q
            );
            return quiz;
          });
          toast.error("Incorrect Answer. Correct answer is " + data.message);
        }
      });
    }
  };

  const handleNextQuestion = () => {
    if(currentQuestion==questions.length-1){
    updateQuiz(
        questions[currentQuestion].id,
        { isAnswered: true},
      ).then(data=>data);
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setTimeLeft(QUESTION_TIME);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setQuizComplete(true);
    }
  };

  if (quizComplete) {
    return (
      <QuizComplete
        nextRound={"/round-2"}
        score={score}
      />
    );
  }

  return (
    <>
      <div
        style={{
          width: 719.72,
          height: 92,
          left: 360,
          top: 60,
          position: "absolute",
          backgroundImage: "url('/img/Group 513272.png')",
        }}
        className=""
      ></div>
      <div
        style={{
          backgroundImage: "url('/img/Earth 65 - spiderverse 1.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="min-h-screen flex  items-left p-4 space-y-6 gap-2 md:bg-cover"
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "rgba(138.54, 138.54, 138.54, 0.20)",
            borderRadius: 15,
          }}
          className=" w-full max-w-2xl space-y-6 m-7 mt-48 lg:ml-28 bg-opacity-80 p-5 rounded-lg shadow-lg"
        >
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">College Quiz Event</h1>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Question {currentQuestion + 1}/{questions.length}
              </p>
              <p className="font-bold">Score: {score}</p>
            </div>
            <ToastContainer/>
          </div>

          <QuizTimer
            timeLeft={timeLeft}
            maxTime={QUESTION_TIME}
          />

          {questions.length && currentQuestion < questions.length ? (
            <QuizCard
              question={questions[currentQuestion]}
              selectedOption={selectedOption}
              onSelect={handleOptionSelect}
            />
          ) : (
            "Not found"
          )}

          {questions.length &&
            currentQuestion < questions.length &&
            !questions[currentQuestion].isAnswered &&
            selectedOption && (
              <Button
                className="w-full"
                onClick={handleSubmitAnswer}
              >
                Submit Answer
              </Button>
            )}

          {questions.length &&
            currentQuestion < questions.length &&
            questions[currentQuestion].isAnswered && (
              <Button
                className="w-full"
                onClick={() => {
                  handleNextQuestion();
                  changeImage();
                }}
              >
                {currentQuestion < questions.length - 1
                  ? "Next Question"
                  : "Finish Quiz"}
              </Button>
            )}
        </div>

        <div
          style={{
            position: "fixed",
            bottom: 0,
            right: 0,
            width: "750px",
            height: "750px",
            backgroundImage: `url(${imageArray[currentImageIndex]})`,
            backgroundSize: "contain",
            backgroundPosition: "bottom right",
            backgroundRepeat: "no-repeat",
            zIndex: 10,
          }}
          aria-hidden="true"
        />
      </div>
    </>
  );
}
