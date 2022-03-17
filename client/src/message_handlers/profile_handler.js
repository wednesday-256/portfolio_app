const register_handler = (
  data,
  notify,
  username,
  set_profile,
  loggedin,
  closeModal
) => {
  if (data.state === "error") {
    let res = [];
    data.errors.forEach((msg) => {
      res.push(msg.msg);
    });
    let msg = { type: "error", header: "Signin Error.", body: res };
    return notify(msg);
  }

  let profile = data.profile;
  username(profile.user_name);
  set_profile(profile);
  loggedin(true);
  closeModal(false);
  notify({
    type: "success",
    header: "Signup Success",
    body: "Hi " + profile.user_name + ", Welcome to Snow Globe",
  });
};

const recover_handler = (
  data,
  notify,
  username,
  set_profile,
  loggedin,
  closeModal
) => {
  if (data.state === "error") {
    let res = [];
    data.errors.forEach((msg) => {
      res.push(msg.msg);
    });
    let msg = { type: "error", header: "Recovery Error.", body: res };
    return notify(msg);
  }
  let profile = data.profile;
  username(profile.user_name);
  set_profile(profile);
  loggedin(true);
  closeModal(false);
  notify({
    type: "success",
    header: "Recovery Success",
    body: [
      "Hello " + profile.user_name + ", Welcome back.",
      "Please note your recovery key has been updated.",
    ],
  });
};

const update_handler = (data, notify, username, set_profile, closeModal) => {
  if (data.state === "error") {
    let res = [];
    data.errors.forEach((msg) => {
      res.push(msg.msg);
    });
    let msg = { type: "error", header: "Update Error.", body: res };
    return notify(msg);
  }
  let profile = data.profile;
  username(profile.user_name);
  set_profile(profile);
  closeModal(false);
  notify({
    type: "success",
    header: "Update Success",
    body: profile.user_name + ", your profile has been updated successfully.",
  });
};

const delete_handler = (data, notify, loggedIn, closeModal) => {
  if (data.state === "error") {
    let res = [];
    data.errors.forEach((msg) => {
      res.push(msg.msg);
    });
    let msg = { type: "error", header: "Profile Delete Error.", body: res };
    return notify(msg);
  }
  loggedIn(false);
  closeModal(false);
  notify({
    type: "success",
    header: "Profile Success.",
    body: "Your Profile has been deleted successfully.",
  });
};

const check_handler = (data, notify, username, set_profile, loggedin) => {
  if (data.state === "error") {
    return;
  }
  let profile = data.profile;
  username(profile.user_name);
  set_profile(profile);
  loggedin(true);
  notify({
    type: "success",
    header: "Success",
    body: "Hello " + profile.user_name + ", Welcome back.",
    check: true,
  });
};

const login_handler = (
  data,
  notify,
  username,
  set_profile,
  loggedin,
  closeModal
) => {
  if (data.state === "error") {
    let res = [];
    data.errors.forEach((msg) => {
      res.push(msg.msg);
    });

    let msg = { type: "error", header: "Login Error.", body: res };
    return notify(msg);
  }
  let profile = data.profile;
  username(profile.user_name);
  set_profile(profile);
  loggedin(true);
  closeModal(false);
  notify({
    type: "success",
    header: "Login Success",
    body: "Hello " + profile.user_name + ", Welcome back.",
  });
};

const logout_handler = (data, notify, loggedin) => {
  let res = [];
  if (data.state === "error") {
    data.errors.forEach((msg) => {
      res.push(msg.msg);
    });
    let msg = { type: "error", header: "Logout Error.", body: res };
    return notify(msg);
  }
  loggedin(false);
  notify({
    type: "success",
    header: "Success",
    body: "Logged out Successfully, come back Soon.",
  });
};

export {
  register_handler,
  delete_handler,
  update_handler,
  recover_handler,
  login_handler,
  logout_handler,
  check_handler,
};
