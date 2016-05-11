var MeatNotification = function(options)
{
  var storage = $(options).prop('Storage') || LocalMeatStorage;
  var onNotify = $(options).prop('onNotify');
  var notified = {};

  this.enable = function(id)
  {
    storage.storeInt("notification." + id + ".enabled", 1);
  }

  this.disable = function(id)
  {
    storage.storeInt("notification." + id + ".enabled", 1);
  }

  this.enabled = function(id)
  {
    return storage.loadInt("notification." + id + ".enabled") == 1;
  }

  this.feed = function(id, timestamp)
  {
    if(storage.loadInt("notification." + id + ".enabled") == 1)
    {
      var mostRecent = storage.loadInt("notification." + id + ".timestamp");

      if((mostRecent == null || isNaN(mostRecent) || timestamp > mostRecent) && !notified[id] && onNotify)
      {
        onNotify(id, timestamp);

        if(!notified[id])
        {
          notified[id] = timestamp;
        }
        else if(notified[id] < timestamp)
        {
          notified[id] = timestamp;
        }
      }
    }
  }

  this.markReceived = function(id)
  {
    if(notified[id])
    {
      storage.storeInt("notification." + id + ".timestamp", notified[id]);
    }
  }
};
