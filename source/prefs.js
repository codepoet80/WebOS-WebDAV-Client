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
    enyo.log("setting " + name + " to " + JSON.stringify(value));
    localStorage.setItem(name, JSON.stringify(value));
  },

}