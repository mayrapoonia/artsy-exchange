const SUPABASE_URL = "https://jsaqruigjpjyfudeapns.supabase.co";
const SUPABASE_KEY = "sb_publishable_lbZgUQB14No1kyjdr95Xqw_Qci-cUBp";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const email = document.getElementById("email");
const password = document.getElementById("password");
const usernameInput = document.getElementById("usernameInput");
const title = document.getElementById("title");
const content = document.getElementById("content");
// ELEMENTS
const loginView = document.getElementById("loginView");
const usernameView = document.getElementById("usernameView");
const feedView = document.getElementById("feedView");
const userBar = document.getElementById("userBar");
const userName = document.getElementById("userName");
const postsDiv = document.getElementById("posts");

// AUTH
async function signup(){
  await supabase.auth.signUp({
    email: email.value,
    password: password.value
  });
}

async function login(){
  await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  });
}

async function logout(){
  await supabase.auth.signOut();
  location.reload();
}

// USER CHECK
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
      showFeed(data.username, data.is_admin);
    }
  }
}

// SAVE USERNAME
async function saveUsername(){
  const { data: { user } } = await supabase.auth.getUser();

  await supabase.from("profiles").insert([
    { id: user.id, username: usernameInput.value, is_admin: false }
  ]);

  showFeed(usernameInput.value, false);
}

// SHOW FEED
function showFeed(name, isAdmin){
  loginView.classList.add("hidden");
  usernameView.classList.add("hidden");
  feedView.classList.remove("hidden");
  userBar.classList.remove("hidden");

  userName.textContent = name + (isAdmin ? " 👑" : "");
  window.isAdmin = isAdmin;

  loadPosts();
}

// POST WITH IMAGE
async function post(){
  const { data: { user } } = await supabase.auth.getUser();

  let imageUrl = null;
  const file = document.getElementById("imageInput").files[0];

  if(file){
    const filePath = Date.now() + "_" + file.name;

    await supabase.storage
      .from("images")
      .upload(filePath, file);

    const { data } = supabase.storage
      .from("images")
      .getPublicUrl(filePath);

    imageUrl = data.publicUrl;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  await supabase.from("posts").insert([
    {
      title: title.value,
      content: content.value,
      author: profile.username,
      user_id: user.id,
      image_url: imageUrl,
      likes: 0
    }
  ]);

  loadPosts();
}

// LIKE
async function likePost(id, likes){
  await supabase.from("posts")
    .update({ likes: likes + 1 })
    .eq("id", id);

  loadPosts();
}

// DELETE (ADMIN OR OWNER)
async function deletePost(id, ownerId){
  const { data: { user } } = await supabase.auth.getUser();

  if(user.id === ownerId || window.isAdmin){
    await supabase.from("posts").delete().eq("id", id);
    loadPosts();
  } else {
    alert("Not allowed");
  }
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
      ${p.image_url ? `<img src="${p.image_url}">` : ""}
      <br>❤️ ${p.likes}
      <button onclick="likePost(${p.id}, ${p.likes})">Like</button>
      <button onclick="deletePost(${p.id}, '${p.user_id}')">Delete</button>
    `;

    postsDiv.appendChild(div);
  });
}

// START
checkUser();
