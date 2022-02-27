Prefs = {

  getCookie: function(name, defaultValue) {
    if (localStorage.getItem(name) !== null)
    {
    	return JSON.parse(localStorage.getItem(name));
    }
    else
    {
    	return defaultValue;
    }
  },

  setCookie: function(name, value) {
    Log.debug("setting " + name + " to " + value);
    localStorage.setItem(name, JSON.stringify(value));
  },

}