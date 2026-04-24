export const COURSE_MAP: Record<string, Array<{title: string, platform: string, url: string, duration: string, price: string, level: string, affiliate: boolean}>> = {
  coding: [
    {
      title: "Master the Coding Interview: DSA",
      platform: "Udemy",
      url: "https://www.udemy.com/course/master-the-coding-interview-data-structures-algorithms/",
      duration: "19.5 hours",
      price: "₹499",
      level: "Beginner to Advanced",
      affiliate: true
    },
    {
      title: "Data Structures & Algorithms in Python",
      platform: "Coursera",
      url: "https://www.coursera.org/specializations/data-structures-algorithms",
      duration: "4 months",
      price: "Free (audit)",
      level: "Intermediate",
      affiliate: true
    },
    {
      title: "SQL for Beginners",
      platform: "NPTEL",
      url: "https://nptel.ac.in/courses/106/106/106106145/",
      duration: "8 weeks",
      price: "Free",
      level: "Beginner",
      affiliate: false
    }
  ],
  aptitude: [
    {
      title: "Quantitative Aptitude for Campus Placements",
      platform: "Udemy",
      url: "https://www.udemy.com/course/quantitative-aptitude/",
      duration: "12 hours",
      price: "₹399",
      level: "Beginner",
      affiliate: true
    },
    {
      title: "IndiaBix Aptitude Practice",
      platform: "IndiaBix",
      url: "https://www.indiabix.com/aptitude/questions-and-answers/",
      duration: "Self-paced",
      price: "Free",
      level: "All levels",
      affiliate: false
    }
  ],
  core_subjects: [
    {
      title: "Database Management Systems - NPTEL",
      platform: "NPTEL",
      url: "https://nptel.ac.in/courses/106/106/106106093/",
      duration: "12 weeks",
      price: "Free",
      level: "Intermediate",
      affiliate: false
    },
    {
      title: "Operating Systems from scratch",
      platform: "Udemy",
      url: "https://www.udemy.com/course/operating-systems-from-scratch-part1/",
      duration: "10 hours",
      price: "₹499",
      level: "Intermediate",
      affiliate: true
    }
  ],
  soft_skills: [
    {
      title: "English Communication Skills",
      platform: "Coursera",
      url: "https://www.coursera.org/learn/improve-english",
      duration: "4 weeks",
      price: "Free (audit)",
      level: "Beginner",
      affiliate: true
    },
    {
      title: "Public Speaking & Presentation",
      platform: "Udemy",
      url: "https://www.udemy.com/course/the-complete-presentation-and-public-speaking-course/",
      duration: "8.5 hours",
      price: "₹499",
      level: "All levels",
      affiliate: true
    }
  ],
  advanced: [
    {
      title: "System Design Interview Prep",
      platform: "Udemy",
      url: "https://www.udemy.com/course/system-design-interview-prep/",
      duration: "15 hours",
      price: "₹499",
      level: "Advanced",
      affiliate: true
    },
    {
      title: "Advanced Machine Learning specialisation",
      platform: "Coursera",
      url: "https://www.coursera.org/specializations/advanced-machine-learning",
      duration: "5 months",
      price: "Free (audit)",
      level: "Advanced",
      affiliate: true
    }
  ]
};
