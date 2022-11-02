Step 1 Clone the GitHub repository for source code:
  -  Open GitHub Desktop application and navigate to the dropdown bar "current repository" at the top of the window
  -  Once seleted press the add button and select the option to "clone repository"
  -  Input the following URL:https://github.com/JoshRyan123/OBTG

Step 2 Heroku website setup:
  -  Navigate to https://dashboard.heroku.com/ and complete the account create process
  -  Once logged in navigate to the "apps" section using the https://dashboard.heroku.com/apps URL
  -  Select "new" and create a unique name for the website
  -  Download the Heroku CLI from: https://devcenter.heroku.com/articles/heroku-cli
  -  Once installed open the command line and login with heroku by typing "heroku login" (should be done automatically)
  -  Now navigate to the directory that the application is saved in using the CLI, for me this is: "cd C:\Work\GitHub\OBTG"

  -  In the correct repository type the following to host the website;
  1.  "git init"
  2.  "heroku git:remote -a <applicationname>"
  3.  "git push heroku main" (provided all files are uploaded correctly to the cloned repositoy)

  - To provision the database for the website type the following in console whilst in the project directory;
  1.  On the dashboard of the Heroku website for the app just created: https://dashboard.heroku.com/apps/<application_name>
      navigate to the section labelled "Resources"
  2.  In the "quick add add-ons from Elements" bar "Heroku postgres" and complete the free appication
  3.  Select the subsequent option that appear below the bar, and navigate to the "Settings" tab where you will find the database credentials
  4.  Back in the console type the following with the correct database credentials <psql --host=<Host> --port=<Port> --username=<User> --password --dbname=<Database>
      For me this was: <psql --host=ec2-34-194-171-47.compute-1.amazonaws.com --port=5432 --username=jkerlxoutxkjxl --password --dbname=d733ieh2c2cvg9>
  5.  Provide the correct password from the database credentials in the pop-up that appears in console
  6.  Finally type the following to apply the database script to the webserver "heroku pg:psql --app <project name> < <sql script>"
      For me this was: "heroku pg:psql --app onlinebraintraininggame < database-script/databases.sql"

Step 3 setting up emailing syetem through Google OAuth2 (2 options):
1. Contact owner of the repository for access and refresh tokens:
  -  refresh token needed on line 12 of app.js
  -  access token needed on line 13 of app.js
2. Generate them:
  -  Navigate the the URL: https://console.cloud.google.com/ and complete the account create process for a throw away gmail account if you havent already got one
  -  Select the option "select a project" and click "create new project", give the project any name
  -  Once the project is created along the navigational tab to the left hand side select "APIs and services" and "OAuth concent screen" in the subsequent drop-tab
  -  Check "external user" and press "create"
  -  In the page that appear retype the name of the project created and also select the gmail you are using in the email drop-tab
  -  Do not submit a logo, otherwise this will take some weeks to review before ready
  -  Provide the email again in the "Developer contect information" window and press save and continue at the bottom
  -  On the "scopes" tab press "save and continue"
  -  On the "optional info" tab press "save and continue"
  -  On the "summary" tab press "back to dashboard"
  -  once back to the "OAuth concent screen" dashboard in the section labelled "test users" specify the gmail you are using at a user and press ENTER to confirm
  -  navigate to the "Credentials" tab of "APIs and Services" using the nav tab on the left hand side of the screen
  -  At the top of the page select "CREATE CREDENTIALS" and select "OAuth Client ID" in the subsequent drop-down
  -  Specify the application type to be "Web Application" and in put the redirect URI: https://developers.google.com/oauthplayground into the relevant section at the bottom before selecting "CREATE"
  -  Select and open the newly created client in the "Credential" tab
  -  Open another tab in browser and navigate to the redirect URI specified before
  -  Once there first select the cog icon in the top right hand corner and select "Use your own OAuth credentials"
  -  Paste in the associated Client ID and Client Secret displayed on the other tab you have open back in https://console.cloud.google.com/apis/credentials/oauthclient
  -  Once inputted correctly close out of the cog window and where the box saying "Input your own scopes" type in "https://mail.google.com" abd select Authorize APIs
  -  On the resulting window exchange the authorization token for the required refresh and access tokens required on lines 12 and 13 of app.js
  -  Replace the lines 34 and 252 on app.js with the email address of the mail used in the setup

Step 4 Starting the app in command line:
  - Navigate to the correct directory, for me this is "cd C:\Work\GitHub\OBTG"
  - Type "heroku open" to open the website!

  - NOTE: If files fail to load try putting the content of the connect4, tictactoe and pong folders inside the main project folder, this might be caused by some indexing errors
          arrisen in the transeral of the project, making it so the website cannot find the correct files to load. But this should be able to be fix by just moving files around
          into the appropriate index