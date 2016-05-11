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
  }
};
