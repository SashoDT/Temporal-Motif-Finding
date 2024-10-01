# Temporal-Motif-Finding

How to start the application:
1) Start the neo4j Database: After starting your Neo4j Server run the command ":PLAY movies". After, scroll one page and run the large CREATE query. This should add data into your database
2) To run the Backend, follow these steps:

   Navigate to the "resource" folder and to the "application.properties" file. There, you should set your username and password for the neo4j server.

  Before you go any further, you should have Apache Maven 3.9.8 installed on your machine. After this, open a console window and navigate to the "graphBackend" folder. There run the following command: "mvn clean      install". After this is done, to run the Backend simply run in the same folder "mvn spring-boot:run".

3) For the Frontend simply run "npm install" first and "ng serve" afterwards. 

With these steps, the application should be up and running.
