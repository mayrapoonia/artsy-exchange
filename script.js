const SUPABASE_URL = "https://jsaqruigjpjyfudeapns.supabase.co";
const SUPABASE_KEY = "sb_publishable_lbZgUQB14No1kyjdr95Xqw_Qci-cUBp";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ELEMENTS
const loginView = document.getElementById("loginView");
const usernameView = document.getElementById("usernameView");
const feedView = document.getElementById("feedView");
const userBar = document.getElementById("userBar");
const userName = document.getElementById("userName");
const postsDiv = document.getElementById("posts");

// SIGNUP
async function signup(){
  const email = emailInput.value;
  const password = passwordInput.value;

  const { error } = await supabase.auth.signUp({ email, password });

  if(error) alert(error.message);
}

// LOGIN
async function login(){
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInput.value,
    password: passwordInput.value
  });

  if(error) alert(error.message);
}

// LOGOUT
async function logout(){
  await supabase.auth.signOut();
  location.reload();
}

// CHECK USER
async function checkUser(){
  const { data: { user } } = await supabase.auth.getUser();

  if(user){
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if(!data){
      usernameView.classList.remove("hidden");
    } else {
      showFeed(data.username);
    }
  }
}

// SAVE USERNAME
async function saveUsername(){
  const username = document.getElementById("usernameInput").value;
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("profiles").insert([
    { id: user.id, username }
  ]);

  showFeed(username);
}

// SHOW FEED
function showFeed(name){
  loginView.classList.add("hidden");
  usernameView.classList.add("hidden");
  feedView.classList.remove("hidden");
  userBar.classList.remove("hidden");

  userName.textContent = name;
  loadPosts();
}

// POST
async function post(){
  const title = document.getElementById("title").value;
  const content = document.getElementById("content").value;

  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  await supabase.from("posts").insert([
    { title, content, author: profile.username, likes: 0 }
  ]);

  loadPosts();
}

// LIKE
async function likePost(id, currentLikes){
  await supabase
    .from("posts")
    .update({ likes: currentLikes + 1 })
    .eq("id", id);

  loadPosts();
}

// DELETE
async function deletePost(id){
  await supabase.from("posts").delete().eq("id", id);
  loadPosts();
}

// LOAD POSTS
async function loadPosts(){
  const { data } = await supabase
    .from("posts")
    .select("*")
    .order("id", { ascending: false });

  postsDiv.innerHTML = "";

  data.forEach(p=>{
    const div = document.createElement("div");
    div.className = "post";

    div.innerHTML = `
      <h3>${p.title}</h3>
      <p>${p.content}</p>
      <small>${p.author}</small><br>
      ❤️ ${p.likes || 0}
      <button onclick="likePost(${p.id}, ${p.likes || 0})">Like</button>
      <button onclick="deletePost(${p.id})">Delete</button>
    `;

    postsDiv.appendChild(div);
  });
}

// START
checkUser();
