export function asyncWrapper(functionToWrap) {
  return async (req, res, next) => {
    try {
      await functionToWrap(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/*
// can also use this
// export {asyncWrapper}

// without wrapper
app.get("/users", async (req, res, next) => {
  try {
    const users = await User.find(); // fetch all
    res.json(users);
  } catch (error) {
    next(error);
  }
});

app.get("/users/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new Error("User not found");
    res.json(user);
  } catch (error) {
    next(error);
  }
});

app.post("/users", async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});



export function asyncWrapper(functionToWrap) {
  return async (req, res, next) => {
    try {
      await functionToWrap(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

// with wrapper
app.get(
  "/users",
  asyncWrapper(async (req, res, next) => {
    const users = await User.find(); // fetch all
    res.json(users);
  }),
);

app.get(
  "/users/:id",
  asyncWrapper(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new Error("User not found");
    res.json(user);
  }),
);

app.post(
  "/users",
  asyncWrapper(async (req, res, next) => {
    const newUser = await User.create(req.body);
    res.status(201).json(newUser);
  }),
);


// ------------------

// without wrapper
app.get("/users", async (req, res, next) => {
  try {
    const users = await User.find(); 
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Notice every time you make a route handler function you do this.
async (req, res, next) => {
  try {
    something(req, res, next); // something uses req, res, next so we passed it.
  } catch (error) {
    next(error);
  }
}

// we can generalize this and just pass something() to this
function similarLogic (something) {
  return async (req, res, next) => {
      try {
        something(req, res, next);
      } catch (error) {
        next(error);
      }
    }
}

// with wrapper
app.get("/users", similarLogic(async function(req, res, next) {
    const users = await User.find(); 
    return res.json(users);
}));

// can also do it like this
async function getAllUsers (req, res, next) {
    const users = await User.find(); 
    return res.json(users);
}

app.get("/users", similarLogic(getAllUsers));

*/
