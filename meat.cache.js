var MeatCache = function(options)
{
  var storage = $(options).prop('Storage') || LocalMeatStorage;
  var autoGC = parseInt($(options).prop('AutoGC'), 10);
  var step = 0;

  if(isNaN(autoGC))
  {
    autoGC = 10;
  }

  var runAutoGC = function()
  {
    step++;

    if(autoGC > 0 && step >= autoGC)
    {
      this.gc();
      step = 0;
    }
  };

  MeatCache.FLAGS_NONE = 0;
  MeatCache.FLAGS_REFRESH_ON_READ = 1;

  this.set = function(key, text, lifetime, flags)
  {
    runAutoGC();

    var now = new Date().getTime();

    lifetime = lifetime || 0;
    flags = flags || 0;

    storage.storeJSON("cache." + key, {Value: text, Lifetime: lifetime, Timestamp: now, Flags: flags});
  };

  this.setJSON = function(key, json, lifetime, flags)
  {
    this.set(key, JSON.stringify(json), lifetime, flags);
  };

  this.get = function(key)
  {
    runAutoGC();

    var k = "cache." + key;
    var result = null;

    var obj = storage.loadJSON(k);

    if(obj != null)
    {
      var now = new Date().getTime();

      if(now - obj.Timestamp <= obj.Lifetime * 1000)
      {
        result = obj.Value;

        if(obj.Flags & MeatCache.FLAGS_REFRESH_ON_READ)
        {
          obj.Timestamp = now;
          storage.storeJSON(k, obj);
        }
      }
      else
      {
        storage.remove(k);
      }
    }

    return result;
  };

  this.getJSON = function(key)
  {
    return eval("(" + this.get(key) + ")");
  };

  this.remove = function(key)
  {
    storage.remove("cache." + key);
  }

  this.gc = function()
  {
    var now = new Date().getTime();
    var keys = new Array();

    /* collect expired keys */
    storage.each(function(key, value)
    {
      if(/^cache\./.test(key))
      {
        var obj = eval("(" + value + ")");

        if(now - obj.Timestamp > obj.Lifetime * 1000)
        {
          keys.push(key);
        }
      }
    });

    /* remove expired keys */
    $.each(keys, function(index, key)
    {
      storage.remove(key);
    });
  };

};
