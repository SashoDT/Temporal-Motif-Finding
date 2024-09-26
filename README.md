# Temporal-Motif-Finding

How to start the application:
1) Start the neo4j Database: After starting your Neo4j Server run the command ":PLAY movies". After, scroll one page and run the large CREATE query. This should add data into your database
2) To run the Backend, follow these steps:
   Once you have opened the Backend folder of the project, on the bottom left there should be a prompt: 

  Build scripts found 
  Maven: graphBackend
  Gradle: graphBackend

  Click "Load all"

  If the prompt doesn't show up run the following commands in the "graphbackend" folder:
  For Windows .\gradlew.bat
  For Unix/Linux/macOS ./gradlew build

  Afterwards, navigate to the "resource" folder and to the "application.properties" file. There, you should set your username and password for the neo4j server.

  After this, simply run the main method in the project (Some code lines could be marked red, but this doesn't make a difference. The system should run).

3) For the Frontend simply run "npm install" first and "ng serve" afterwards. 

With these steps, the application should be up and running.
