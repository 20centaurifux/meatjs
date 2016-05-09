var MeatREST = function(options)
{
  this.opts = $.extend({Server: "http://10.0.0.33:8888", Username: "", Password: ""}, options);
};

MeatREST.prototype.requestAccount = function(username, email)
{
  return $.post(this.opts.Server + "/rest/registration", {username: username, email: email});
}

MeatREST.prototype.requestPassword = function(username, email)
{
  return $.post(this.opts.Server + "/rest/user/" + encodeURIComponent(username) + "/password/reset", {username: username, email: email});
}

MeatREST.prototype.setAuthData = function(username, password)
{
  this.opts.Username = username;
  this.opts.Password = password;
}

MeatREST.prototype.getOwnProfile = function()
{
  return this.getProfile(this.opts.Username);
}

MeatREST.prototype.getProfile = function(username)
{
  return this.requestJSON("GET", "/rest/user/" + encodeURIComponent(username), null)
}

MeatREST.prototype.updateProfile = function(email, firstname, lastname, gender, language, protected)
{
  var m = {email: email, firstname: firstname, lastname: lastname, gender: gender, language: language, protected: protected};

  return this.requestJSON("POST", "/rest/user/" + encodeURIComponent(this.opts.Username), m);
}

MeatREST.prototype.updatePassword = function(old_password, new_password1, new_password2)
{
  var m = {old_password: old_password, new_password1: new_password1, new_password2: new_password2};

  return this.requestJSON("POST", "/rest/user/" + encodeURIComponent(this.opts.Username) + "/password", m);
}

MeatREST.prototype.passwordReset = function(username, email)
{
  var m = {username: username, email: email};

  return this.requestJSON("POST", "/rest/user/" + encodeURIComponent(username) + "/password/reset", m);
}

MeatREST.prototype.searchUsers = function(query)
{
  return this.requestJSON("GET", "/rest/user/search/" + encodeURIComponent(query), null);
}

MeatREST.prototype.getFriendship = function(username)
{
  return this.requestJSON("GET", "/rest/user/" + encodeURIComponent(username) + "/friendship", null);
}

MeatREST.prototype.follow = function(username, follow)
{
  var method = follow ? "PUT" : "DELETE";

  return this.requestJSON(method, "/rest/user/" + encodeURIComponent(username) + "/friendship", null);
}

MeatREST.prototype.getFavorites = function()
{
  return this.requestJSON("GET", "/rest/favorites", null);
}

MeatREST.prototype.favor = function(guid, favor)
{
  var method = favor ? "PUT" : "DELETE";

  return this.requestJSON(method, "/rest/favorites/" + guid, {guid: guid});
}

MeatREST.prototype.getMessages = function(limit)
{
  return this.requestJSON("GET", "/rest/messages?limit=" + limit, null);
}

MeatREST.prototype.getPublicMessages = function(limit)
{
  return this.requestJSON("GET", "/rest/public?limit=" + limit, null);
}

MeatREST.prototype.getObject = function(guid)
{
  return this.requestJSON("GET", "/rest/object/" + guid, null);
}

MeatREST.prototype.getObjectTags = function(guid)
{
  return this.requestJSON("GET", "/rest/object/" + guid + "/tags", null);
}

MeatREST.prototype.addObjectTags = function(guid, tags)
{
  return this.requestJSON("PUT", "/rest/object/" + guid + "/tags", {tags: tags.join()});
}

MeatREST.prototype.vote = function(guid, up)
{
  return this.requestJSON("POST", "/rest/object/" + guid + "/vote", {up: up});
}

MeatREST.prototype.getVote = function(guid)
{
  return this.requestJSON("GET", "/rest/object/" + guid + "/vote", null);
}

MeatREST.prototype.addComment = function(guid, text)
{
  return this.requestJSON("POST", "/rest/object/" + guid + "/comments", {text: text});
}

MeatREST.prototype.getComment = function(id)
{
  return this.requestJSON("GET", "/rest/comment/" + id, null);
}

MeatREST.prototype.getComments = function(guid, page, pageSize)
{
  return this.requestJSON("GET", "/rest/object/" + guid + "/comments/page/" + page + "?page_size=" + pageSize, null);
}

MeatREST.prototype.getObjects = function(page, pageSize)
{
  return this.requestJSON("GET", "/rest/objects/page/" + page + "?page_size=" + pageSize, null);
}

MeatREST.prototype.getPopularObjects = function(page, pageSize)
{
  return this.requestJSON("GET", "/rest/objects/popular/page/" + page + "?page_size=" + pageSize, null);
}

MeatREST.prototype.getTaggedObjects = function(tag, page, pageSize)
{
  return this.requestJSON("GET", "/rest/objects/tag/" + tag + "/page/" + page + "?page_size=" + pageSize, null);
}

MeatREST.prototype.getRandomObjects = function(pageSize)
{
  return this.requestJSON("GET", "/rest/objects/random?page_size=" + pageSize, null);
}

MeatREST.prototype.getRecommendations = function(page, pageSize)
{
  return this.requestJSON("GET", "/rest/recommendations/page/" + page + "?page_size=" + pageSize, null);
}

MeatREST.prototype.recommend = function(guid, receivers)
{
  return this.requestJSON("PUT", "/rest/object/" + encodeURIComponent(guid) + "/recommend", {receivers: receivers.join()});
}

MeatREST.prototype.getThumbnail = function(filename)
{
  return this.requestText("GET", "/thumbnails/" + encodeURIComponent(filename));
}

MeatREST.prototype.getImage = function(filename)
{
  return this.requestText("GET", "/images/" + encodeURIComponent(filename));
}

MeatREST.prototype.getOwnAvatar = function(timestamp)
{
  return this.requestText("GET", "/rest/user/" + encodeURIComponent(this.opts.Username) + "/avatar?timestamp=" + timestamp);
}

MeatREST.prototype.getAvatar = function(username)
{
  return this.requestText("GET", "/rest/user/" + encodeURIComponent(username) + "/avatar");
}

MeatREST.prototype.uploadAvatar = function(file)
{
  var d = $.Deferred();
  var reader = new FileReader();
  var url = this.opts.Server + "/rest/user/" + encodeURIComponent(this.opts.Username) + "/avatar";
  var headers = {"Authorization": "Basic " + btoa(this.opts.Username + ":" + this.opts.Password)};

  reader.onload = function(e)
  {
    var form = new FormData();

    form.append("file", file);
    form.append("filename", file.name);

    $.ajax(
    {
      type: "POST",
      url: url,
      async: true,
      processData: false,
      headers: headers,
      contentType: false,
      data: form
    })
      .success(d.resolve)
      .fail(d.reject);
  }

  reader.readAsArrayBuffer(file);

  return d;
}

MeatREST.prototype.request = function(method, type, path, data)
{
  return $.ajax(
  {
    type: method,
    url: this.opts.Server + path,
    dataType: type,
    async: true,
    headers: {"Authorization": "Basic " + btoa(this.opts.Username + ":" + this.opts.Password)},
    data: data
  });
}

MeatREST.prototype.requestJSON = function(method, path, data)
{
  return this.request(method, "json", path, data);
}

MeatREST.prototype.requestText = function(method, path, data)
{
  return this.request(method, "text", path, data);
}
