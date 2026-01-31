"""
Problem Bank - Sample interview problems for different categories
"""

import random
from typing import Optional, Dict, List
from app.models.schemas import InterviewType

SYSTEM_DESIGN_PROBLEMS = [
    {
        "name": "ML Model Serving Platform",
        "content": """Design a scalable machine learning model serving platform that can:
- Handle multiple ML models with different frameworks (TensorFlow, PyTorch, scikit-learn)
- Support real-time predictions with low latency (<100ms)
- Scale to handle 10,000 requests per second
- Support A/B testing and gradual rollouts
- Include monitoring and alerting for model performance

Consider: load balancing, caching, model versioning, and rollback strategies."""
    },
    {
        "name": "Recommendation System",
        "content": """Design a recommendation system for a streaming platform (like Netflix/Spotify) that:
- Provides personalized recommendations for millions of users
- Updates in near real-time based on user interactions
- Handles cold-start problem for new users and new content
- Balances between exploitation (showing what users like) and exploration (discovering new preferences)
- Can explain why items are recommended

Consider: collaborative filtering, content-based filtering, and hybrid approaches."""
    },
    {
        "name": "Fraud Detection Pipeline",
        "content": """Design a real-time fraud detection system for a payment platform that:
- Processes millions of transactions per day
- Detects fraudulent transactions in real-time (<500ms)
- Minimizes false positives while catching most fraud
- Adapts to new fraud patterns over time
- Provides explainable decisions for compliance

Consider: feature engineering, model retraining, feedback loops, and handling imbalanced data."""
    },
    {
        "name": "Search Ranking System",
        "content": """Design a search ranking system for an e-commerce platform that:
- Returns relevant results within 200ms
- Incorporates multiple signals (text relevance, popularity, personalization)
- Handles queries with typos and synonyms
- Supports real-time inventory updates
- Enables easy experimentation with ranking algorithms

Consider: indexing strategies, learning to rank, and online/offline evaluation."""
    }
]

LIVE_CODING_PROBLEMS = [
    {
        "name": "Implement K-Means Clustering",
        "content": """Implement the K-Means clustering algorithm from scratch.

Your implementation should:
1. Initialize k centroids randomly from the data points
2. Assign each point to the nearest centroid
3. Update centroids as the mean of assigned points
4. Repeat until convergence or max iterations

Input: List of data points, number of clusters k
Output: Cluster assignments and final centroids

Example:
points = [[1, 2], [1, 4], [1, 0], [10, 2], [10, 4], [10, 0]]
k = 2
Expected: Two clusters around [1, 2] and [10, 2]"""
    },
    {
        "name": "Feature Preprocessing Pipeline",
        "content": """Implement a feature preprocessing pipeline that handles:

1. Missing value imputation (mean for numeric, mode for categorical)
2. Categorical encoding (one-hot encoding)
3. Numerical scaling (standardization)

Your pipeline should:
- Learn parameters from training data (fit)
- Apply transformations to new data (transform)
- Handle both numeric and categorical features

Write clean, modular code that could be used in production."""
    },
    {
        "name": "Binary Classification Metrics",
        "content": """Implement functions to calculate common binary classification metrics:

1. Accuracy
2. Precision
3. Recall
4. F1 Score
5. ROC-AUC (given predictions and probabilities)

Also implement a function that finds the optimal threshold for a given metric.

Input: y_true (actual labels), y_pred (predicted labels), y_prob (predicted probabilities)
Output: Dictionary of all metrics"""
    },
    {
        "name": "Gradient Descent Optimizer",
        "content": """Implement gradient descent optimization for linear regression.

Your implementation should:
1. Initialize weights randomly
2. Compute gradients of MSE loss
3. Update weights using gradient descent
4. Support batch, mini-batch, and stochastic modes
5. Track loss history for visualization

Bonus: Implement momentum or Adam optimizer variant.

Test on a simple dataset and plot the loss curve."""
    }
]

ML_THEORY_QUESTIONS = [
    {
        "name": "Bias-Variance Tradeoff",
        "content": """Let's discuss the bias-variance tradeoff in machine learning.

Topics to explore:
- What is bias and variance in the context of ML models?
- How does model complexity affect each?
- What is the relationship to overfitting and underfitting?
- How do regularization techniques address this tradeoff?
- Can you give examples of high-bias vs high-variance models?"""
    },
    {
        "name": "Transformer Architecture",
        "content": """Let's dive deep into the Transformer architecture.

Topics to explore:
- What problem does self-attention solve that RNNs couldn't?
- Explain the scaled dot-product attention mechanism
- What are query, key, and value in attention?
- Why do we need positional encoding?
- How does multi-head attention work and why is it useful?
- What is the computational complexity of self-attention?"""
    },
    {
        "name": "Gradient Problems in Deep Learning",
        "content": """Let's discuss gradient-related problems in deep neural networks.

Topics to explore:
- What causes vanishing and exploding gradients?
- How do different activation functions affect gradient flow?
- What techniques help mitigate these issues?
- Explain batch normalization and why it helps
- How do skip connections in ResNet address gradient problems?
- What is gradient clipping and when would you use it?"""
    },
    {
        "name": "Loss Functions and Optimization",
        "content": """Let's explore loss functions and optimization in deep learning.

Topics to explore:
- Compare MSE vs Cross-Entropy loss - when to use each?
- What is the problem with using accuracy as a loss function?
- Explain the intuition behind Adam optimizer
- What is learning rate scheduling and why is it important?
- How does batch size affect optimization?
- What is the difference between local and global minima?"""
    }
]

COACHING_TOPICS = [
    {
        "name": "Interview Preparation Strategy",
        "content": "General interview preparation coaching. Help the candidate develop a study plan, practice strategy, and build confidence for their upcoming ML/AI interviews."
    },
    {
        "name": "Behavioral Interview Prep",
        "content": "Behavioral interview coaching. Help the candidate structure their experiences using STAR format, identify impactful projects to discuss, and practice answering common behavioral questions."
    },
    {
        "name": "Technical Communication",
        "content": "Help the candidate improve how they communicate technical concepts. Practice explaining complex ML topics clearly, structuring system design explanations, and thinking out loud during coding."
    },
    {
        "name": "Career Discussion",
        "content": "Career coaching session. Discuss career goals, evaluate job opportunities, prepare for salary negotiations, or plan professional development in ML/AI."
    }
]

PROBLEM_BANKS = {
    InterviewType.SYSTEM_DESIGN: SYSTEM_DESIGN_PROBLEMS,
    InterviewType.LIVE_CODING: LIVE_CODING_PROBLEMS,
    InterviewType.ML_THEORY: ML_THEORY_QUESTIONS,
    InterviewType.COACHING: COACHING_TOPICS
}


def get_random_problem(interview_type: InterviewType) -> Dict:
    """Get a random problem for the given interview type."""
    problems = PROBLEM_BANKS.get(interview_type, [])
    if not problems:
        return {"name": "General Discussion", "content": "Let's have a general discussion."}
    return random.choice(problems)


def get_all_problems(interview_type: InterviewType) -> List[Dict]:
    """Get all problems for the given interview type."""
    return PROBLEM_BANKS.get(interview_type, [])


def get_problem_by_name(interview_type: InterviewType, name: str) -> Optional[Dict]:
    """Get a specific problem by name."""
    problems = PROBLEM_BANKS.get(interview_type, [])
    for problem in problems:
        if problem["name"].lower() == name.lower():
            return problem
    return None
