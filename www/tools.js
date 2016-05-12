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
  }
};
