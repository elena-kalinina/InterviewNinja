

We are building a voice agent that will help applicants prepare for technical interviews of Machine Learning / AI track. The interviews are: 1. System design 2. Live Coding 3. ML / DL theoretical questions 4. General coaching.
The voice bot will simulate the interviewer in different interview types so that the user can practice articulating
interview problems.

The platform aesthetics should be sleek and professional. The layout should have several tabs corresponding to each interview type. The system design tab should contain a canvas for drawing 
but simple figures only (circle, rectangle, arrows and possibility to add text inside figures / on top of arrows.)
The canvas should be big enough to allow good visibility of shapes and text. 

The Live coding tab should have a window for writing and executing code, LeetCode style.

The tab for theoretical questions should have a window for rendering formulas.

The coaching tab should be just a chat interface.

Requirements for the platform - to implement as buttons / toggles:
a) the user can specify the verbosity of the interviewer bot 
b) the user should be able to specify the tone of the interviewer bot between friendly - neutral - adversarial
c) the user should be able to select between random interview problem, textual description ("LeetCode Blind 75")
or a url as a source
d) if the user specifies a url as a source, the url has to be scraped to extract names and content of problems.
e) the text record of the session should be saved, and Analyze button available for the user to get the analysis of the session and feedback.
f) start button for the session to start - the bot should only start talking when the button is pressed
g) mic button for the user to press when she starts speaking
h) the interviewer voice should be female, if possible sound like a black female

Use Open AI for LLMs and Eleven Labs for TTS / STT. You will be working in /Users/elekal/PyCharmProjects/InterviewNinja, api keys for Open AI and Eleven Labs
are available in the .env file. 


