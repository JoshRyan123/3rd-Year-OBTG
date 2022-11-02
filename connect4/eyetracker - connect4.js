function PlotGaze(GazeData) {
/*
      GazeData.state // 0: valid gaze data; -1 : face tracking lost, 1 : gaze uncalibrated
      GazeData.docX // gaze x in document coordinates
      GazeData.docY // gaze y in document cordinates
      GazeData.time // timestamp
*/        
  $(document).ready(function(){
    $.ajax({
      global: false,
      type: 'POST',
      url: "/eyetracking",
      dataType: 'html',
      data: {
        GazeX: GazeData.GazeX,
        GazeY: GazeData.GazeY,
        HeadX: GazeData.HeadX,
        HeadY: GazeData.HeadY,
        HeadZ: GazeData.HeadZ,
        Yaw: GazeData.HeadYaw,
        Pitch: GazeData.HeadPitch,
        Roll: GazeData.HeadRoll,
        InnerHeight: window.innerHeight,
        InnerWidth: window.innerWidth,
        Game: 'Connect4',
      },
      success: function (result) {
        console.log('Eyetracking Submitted');
      },
      error: function (request, status, error) {
        serviceError();
      }
    });
  });
  /* Only have 1 send request else calibration crashes*/
} 

//////set callbacks/////////
     
window.addEventListener("load", function() {
  //below is code that shows eye position on screen.
  //GazeCloudAPI.OnCalibrationComplete =function(){ShowHeatMap(); console.log('gaze Calibration Complete')  }
  GazeCloudAPI.OnCamDenied =  function(){ console.log('camera  access denied')  }
  GazeCloudAPI.OnError =  function(msg){ console.log('err: ' + msg)  }
  GazeCloudAPI.UseClickRecalibration = true;
  GazeCloudAPI.OnResult = PlotGaze; 
});

function start() {
  document.getElementById("startid").style.display = 'none';
  document.getElementById("stopid").style.display = 'block';

  GazeCloudAPI.StartEyeTracking(); 

  if(false)
    GazeCloudAPI.SetFps(15);
  }

function stop() {
  document.getElementById("startid").style.display = 'block';
  document.getElementById("stopid").style.display = 'none';
  GazeCloudAPI.StopEyeTracking();
}
