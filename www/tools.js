var Tools =
{
  buildDisplayUsername: function(user)
  {
    var fullname = user["firstname"];

    if(user["firstname"] && user["lastname"])
    {
      fullname += " " + user["lastname"]
    }
    else if(!fullname)
    {
      fullname = user["lastname"];
    }

    if(!fullname)
    {
      fullname = "";
    }

    return fullname;
  },
  getFailureMessage: function(response)
  {
    var message = "An unexpected failure occured, please try again later.";

    if(response.responseJSON && response.responseJSON["message"])
    {
      message = response.responseJSON["message"];
    }
    else if(response.status == 403)
    {
      message = "Authentication failed.";
    }

    return message;
  },
  findInvalidField: function(response)
  {
    if(response.responseJSON && response.responseJSON["field"])
    {
      return response.responseJSON["field"];
    }

    return null;
  },
  toUTC: function(d)
  {
    return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  },
  replacePage: function(page)
  {
    if (device.platform == "windows")
    {
      $.mobile.navigate(page);
    }
    else
    {
      window.location.replace(page);

      if (window.navigator.userAgent.indexOf("MSIE") > -1 || window.navigator.userAgent.indexOf("Trident") > -1)
      {
        $("body").pagecontainer("change", page, {changeHash: false});
      }
    }
  },
  isFollowing: function(a, username)
  {
    if(!a)
    {
      return false;
    }

    var length = a.length;

    for(var i = 0; i < length; i++)
    {
      if(a[i].toLowerCase() == username.toLowerCase())
      {
        return true;
      }
    }

    return false;
  },
  sortICase: function(arr)
  {
    arr.sort(function(a, b)
    {
      a = a.toLowerCase();
      b = b.toLowerCase();

      return a === b ? 0 : a > b ? 1 : -1;
    });
  }
};
