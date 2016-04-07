  var MeatStore = function(options)
  {
    var cache = $(options).prop('Cache') || new MeatCache();
    var storage = $(options).prop('Storage') || LocalMeatStorage;
    var avatarTimestamp = new Date().getTime();
    var store = this;

    this.createClient = function()
    {
      var client = new MeatREST();

      client.setAuthData(storage.load("user.Username"), storage.load("user.Password"));

      return client;
    }

    this.getCredentials = function()
    {
      return {Username: storage.load("user.Username"), Password: storage.load("user.Password")};
    }

    this.configured = function()
    {
      return storage.loadBool("app.Configured");
    }

    this.setConfigured = function()
    {
      storage.storeBool("app.Configured", true);
    }

    this.changeCredentials = function(username, password)
    {
      storage.store("user.Username", username);
      storage.store("user.Password", password);

      cache.remove("user.Profile");

      return store.getOwnProfile();
    }

    this.getOwnProfile = function()
    {
      var d = $.Deferred();

      var profile = cache.getJSON("user.Profile");

      if(profile == null)
      {
        var client = store.createClient();

        client.getOwnProfile()
          .success(function(profile)
          {
            cache.setJSON("user.Profile", profile, 300);
            d.resolve(profile);
          })
          .fail(d.reject);
      }
      else if(profile != null)
      {
        d.resolve(profile);
      }
      else
      {
        d.reject(profile);
    }

    return d.promise();
  }

  this.getProfile = function(username)
  {
      var d = $.Deferred();

      var key = "user.Other." + username.toLowerCase();
      var profile = cache.getJSON(key);

      if(profile == null)
      {
        var client = store.createClient();

        client.getProfile(username)
          .success(function(profile)
          {
            cache.setJSON(key, profile, 300);
            d.resolve(profile);
          })
          .fail(d.reject);
      }
      else if(profile != null)
      {
        d.resolve(profile);
      }
      else
      {
        d.reject(profile);
    }

    return d.promise();
  }

  this.updateProfile = function(email, firstname, lastname, language, sex, protected)
  {
    var p = store.createClient().updateProfile(email, firstname, lastname, sex, language, protected);

    p.done(function(profile)
    {
      cache.setJSON("user.Profile", profile, 300);
    });

    return p;
  }

  this.updatePassword = function(new_password1, new_password2)
  {
    var d = $.Deferred();

    store.createClient().updatePassword(storage.load("user.Password"), new_password1, new_password2)
      .success(function(response)
      {
        storage.store("user.Password", new_password1);

        d.resolve(response);
      })
      .fail(d.reject);

    return d.promise();
  }

  this.requestAccount = function(username, email)
  {
    var d = $.Deferred();

    store.createClient().requestAccount(username, email)
      .success(function(response)
      {
        storage.storeInt("app.LastAccountRequest", new Date().getTime());
        d.resolve(response);
      })
      .fail(d.reject);

    return d.promise();
  }

  this.lastAccountRequestTimeoutExpired = function(seconds)
  {
    return isExpired("app.LastAccountRequest", seconds);
  }

  this.requestPassword = function(username, email)
  {
    var d = $.Deferred();

    store.createClient().requestPassword(username, email)
      .success(function(response)
      {
        storage.storeInt("app.LastPasswordReset", new Date().getTime());
        d.resolve(response);
      })
      .fail(d.reject);

    return d.promise();
  }

  this.lastPasswordResetTimeoutExpired = function(seconds)
  {
    return isExpired("app.LastPasswordReset", seconds);
  }

  var isExpired = function(key, seconds)
  {
    var timestamp = storage.loadInt(key);
    var expired = true;

    if(!isNaN(timestamp))
    {
      var diff = (new Date().getTime() - timestamp) / 1000;

      expired = diff > seconds;
    }

    return expired;
  }

  this.getObjects = function(page, pageSize)
  {
    return store.createClient().getObjects(page, pageSize).promise();
  }

  this.getRandom = function(pageSize)
  {
    return store.createClient().getRandomObjects(pageSize).promise();
  }

  this.getPopular = function(page, pageSize)
  {
    return store.createClient().getPopularObjects(page, pageSize).promise();
  }

  this.getObject = function(guid)
  {
    return store.createClient().getObject(guid).promise();
  }

  this.getFavorites = function()
  {
    return store.createClient().getFavorites().promise();
  }

  this.favor = function(guid, favor)
  {
    var client = store.createClient();

    return client.favor(guid, favor).then(function() { return client.getObject(guid); });
  }

  this.getVote = function(guid)
  {
    return store.createClient().getVote(guid).promise();
  }

  this.like = function(guid, like)
  {
    var client = store.createClient();

    return client.vote(guid, like).then(function() { return client.getObject(guid); });
  }

  this.getImage = function(source)
  {
    return store.createClient().getImage(source).promise();
  }

  this.searchUsers = function(query)
  {
    return store.createClient().searchUsers(query).promise();
  }

  this.follow = function(username, follow)
  {
    var client = store.createClient();

    return client.follow(username, follow).then(function()
    {
      cache.remove("user.Profile");

      return store.getOwnProfile();
    });
  }

  this.getAvatar = function(username)
  {
    if(username.toLowerCase() == storage.load("user.Username").toLowerCase())
    {
      return store.getOwnAvatar();
    }

    return store.createClient().getAvatar(username).promise();
  }

  this.getOwnAvatar = function()
  {
    return store.createClient().getOwnAvatar(avatarTimestamp).promise();
  }

  this.uploadAvatar = function(file)
  {
      return store.createClient().uploadAvatar(file).promise()
        .done(function()
        {
          avatarTimestamp = new Date().getTime();
        });
  }

  this.getComments = function(guid, page, pageSize)
  {
    return store.createClient().getComments(guid, page, pageSize);
  }

  this.addComment = function(guid, text)
  {
    var client = store.createClient();

    return store.createClient().addComment(guid, text).then(function() { return client.getObject(guid); });
  }
}
