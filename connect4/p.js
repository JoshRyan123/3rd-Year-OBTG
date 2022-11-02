/* header javascript functionality */
$(document).ready(function(){

    var header = $(".header");
    var loginlnk = $(".loginlnk");
    var signuplnk = $(".signuplnk");
    var logoutlnk = $(".logoutlnk");
    
    $(window).scroll(function(){
        var scroll = $(window).scrollTop();
        if (scroll > 1) {
            header.removeClass('header').addClass("header-alt");
            loginlnk.removeClass('loginlnk').addClass("loginlnk-alt");
            signuplnk.removeClass('signuplnk').addClass("signuplnk-alt");
            logoutlnk.removeClass('logoutlnk').addClass("logoutlnk-alt");
        }
  
        else{
            header.removeClass('header-alt').addClass("header");
            loginlnk.removeClass('loginlnk-alt').addClass("loginlnk");
            signuplnk.removeClass('signuplnk-alt').addClass("signuplnk");
            logoutlnk.removeClass('logoutlnk-alt').addClass("logoutlnk");	
        }
    })
  })