require("dotenv").config();
const mongoose = require("mongoose");
const Topic = require("./models/Topic");
const Question = require("./models/Question");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/quizengine";

const newQuestions = [
  {
    text: "What does HTML stand for?",
    options: ["HyperText Markup Language", "HyperText Modern Language", "HighText Machine Language", "HyperTransfer Markup Language"],
    correctAnswer: 0,
    difficulty: "easy",
    explanation: "HTML stands for HyperText Markup Language. It is the standard language used to create and structure content on the web.",
    timeLimitSeconds: 20
  },
  {
    text: "Which tag is used to define the largest heading in HTML?",
    options: ["<h6>", "<heading>", "<h1>", "<head>"],
    correctAnswer: 2,
    difficulty: "easy",
    explanation: "HTML has six heading levels from <h1> to <h6>. <h1> is the largest and most important, while <h6> is the smallest.",
    timeLimitSeconds: 20
  },
  {
    text: "Which HTML attribute is used to define inline styles?",
    options: ["class", "font", "styles", "style"],
    correctAnswer: 3,
    difficulty: "easy",
    explanation: "The 'style' attribute is used to add inline CSS directly to an HTML element, e.g. <p style=\"color:red\">.",
    timeLimitSeconds: 20
  },
  {
    text: "Which tag is used to create a hyperlink in HTML?",
    options: ["<link>", "<a>", "<href>", "<nav>"],
    correctAnswer: 1,
    difficulty: "easy",
    explanation: "The <a> (anchor) tag is used to create hyperlinks. The destination URL is specified using the 'href' attribute.",
    timeLimitSeconds: 20
  },
  {
    text: "Which HTML element is used to display an image?",
    options: ["<picture>", "<media>", "<src>", "<img>"],
    correctAnswer: 3,
    difficulty: "easy",
    explanation: "The <img> tag is used to embed images. It is a self-closing tag and uses the 'src' attribute to specify the image path.",
    timeLimitSeconds: 20
  },
  {
    text: "What is the correct HTML tag for inserting a line break?",
    options: ["<lb>", "<break>", "<br>", "<newline>"],
    correctAnswer: 2,
    difficulty: "easy",
    explanation: "<br> is a self-closing tag used to insert a single line break. It does not require a closing tag.",
    timeLimitSeconds: 20
  },
  {
    text: "Which HTML element defines the title of a document shown in the browser tab?",
    options: ["<meta>", "<header>", "<title>", "<head>"],
    correctAnswer: 2,
    difficulty: "medium",
    explanation: "The <title> element is placed inside <head> and defines the title shown in the browser tab and search engine results.",
    timeLimitSeconds: 25
  },
  {
    text: "What is the correct way to create an ordered list in HTML?",
    options: ["<ul>", "<list>", "<ol>", "<dl>"],
    correctAnswer: 2,
    difficulty: "medium",
    explanation: "<ol> creates an ordered (numbered) list. <ul> creates an unordered (bullet) list. Each item in both uses the <li> tag.",
    timeLimitSeconds: 25
  },
  {
    text: "Which attribute is used to open a hyperlink in a new browser tab?",
    options: ["rel=\"noopener\"", "target=\"_blank\"", "href=\"new\"", "open=\"tab\""],
    correctAnswer: 1,
    difficulty: "medium",
    explanation: "target=\"_blank\" opens the link in a new tab. It's best practice to also add rel=\"noopener noreferrer\" for security.",
    timeLimitSeconds: 25
  },
  {
    text: "Which HTML element is used to define a table row?",
    options: ["<td>", "<th>", "<tr>", "<row>"],
    correctAnswer: 2,
    difficulty: "medium",
    explanation: "<tr> defines a table row. <td> defines a table data cell, and <th> defines a table header cell — both go inside <tr>.",
    timeLimitSeconds: 25
  },
  {
    text: "What does the 'alt' attribute in an <img> tag do?",
    options: ["Sets image alignment", "Adds a tooltip on hover", "Provides alternative text if image fails to load", "Sets the image file path"],
    correctAnswer: 2,
    difficulty: "medium",
    explanation: "The 'alt' attribute provides alternative text for an image. It displays if the image can't load and improves accessibility for screen readers.",
    timeLimitSeconds: 25
  },
  {
    text: "Which HTML tag is used to define a block of navigation links?",
    options: ["<section>", "<nav>", "<aside>", "<menu>"],
    correctAnswer: 1,
    difficulty: "medium",
    explanation: "The <nav> semantic element is used to wrap a set of navigation links. It helps search engines and screen readers identify the navigation area.",
    timeLimitSeconds: 25
  },
  {
    text: "What is the purpose of the 'defer' attribute in a <script> tag?",
    options: ["Loads the script from a CDN", "Prevents the script from running", "Executes the script after the HTML document is fully parsed", "Loads the script asynchronously and runs it immediately"],
    correctAnswer: 2,
    difficulty: "hard",
    explanation: "'defer' tells the browser to download the script in the background but only execute it after the HTML is fully parsed. This avoids blocking page rendering.",
    timeLimitSeconds: 30
  },
  {
    text: "Which HTML5 element is used to draw graphics via JavaScript?",
    options: ["<draw>", "<svg>", "<canvas>", "<graphic>"],
    correctAnswer: 2,
    difficulty: "hard",
    explanation: "The <canvas> element provides a drawing surface for JavaScript-based graphics like charts, animations, and games. <svg> is for vector graphics but uses XML, not JS directly.",
    timeLimitSeconds: 30
  },
  {
    text: "What is the difference between 'id' and 'class' attributes in HTML?",
    options: ["id can be reused; class must be unique", "id must be unique per page; class can be shared by multiple elements", "Both must be unique per page", "There is no difference — they are interchangeable"],
    correctAnswer: 1,
    difficulty: "hard",
    explanation: "An 'id' must be unique within a page — only one element can have a given id. A 'class' can be applied to multiple elements, making it ideal for shared styles or behaviors.",
    timeLimitSeconds: 30
  }
];

async function addQuestions() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("📦 Connected to MongoDB...");

    const htmlTopic = await Topic.findOne({ name: "HTML Fundamentals" });
    if (!htmlTopic) {
      console.error("❌ Could not find 'HTML Fundamentals' topic. Please run 'npm run seed' first.");
      process.exit(1);
    }

    const questionsWithId = newQuestions.map(q => ({
      ...q,
      topicId: htmlTopic._id
    }));

    await Question.insertMany(questionsWithId);
    console.log(`✅ Successfully added ${newQuestions.length} new questions to HTML Fundamentals!`);

  } catch (err) {
    console.error("❌ Error adding questions:", err);
  } finally {
    await mongoose.disconnect();
  }
}

addQuestions();
