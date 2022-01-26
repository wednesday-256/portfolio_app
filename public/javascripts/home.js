//add event to the color play button
document.querySelector('#create_clr').addEventListener('click', (e)=>{
  let frm = document.querySelector('#create_box')
  frm.style.display = frm.style.display == 'none'? 'flex': 'none'
})
document.querySelector('#create_box').addEventListener('mouseleave', (e)=>{
  e.target.style.display = 'none';
})
document.querySelector('#join_clr').addEventListener('click', (e)=>{
  let box = document.querySelector('#join_clr_box')
  box.style.display = box.style.display == 'none' ? 'flex': 'none'
  box.style.display == 'flex'? box.querySelector("input[name='key']").focus() : null
})
document.querySelector('#join_clr_box').addEventListener('mouseleave', (e)=>{
  e.target.style.display = 'none'
})

//add event to the tic tac toe play button
document.querySelector('#create_ttt').addEventListener('click', (e)=>{
  let frm = document.querySelector('#tcreate_box')
  frm.style.display = frm.style.display == 'none'? 'flex': 'none'
})
document.querySelector('#tcreate_box').addEventListener('mouseleave', (e)=>{
  e.target.style.display = 'none';
})
document.querySelector('#join_ttt').addEventListener('click', (e)=>{
  let box = document.querySelector('#join_ttt_box')
  box.style.display = box.style.display == 'none' ? 'flex': 'none'
  box.style.display == 'flex'? box.querySelector("input[name='key']").focus() : null
})
document.querySelector('#join_ttt_box').addEventListener('mouseleave', (e)=>{
  e.target.style.display = 'none'
})

//add event to the checkers play button
document.querySelector('#create_chk').addEventListener('click', (e)=>{
  let frm = document.querySelector('#ccreate_box')
  frm.style.display = frm.style.display == 'none'? 'flex': 'none'
})
document.querySelector('#ccreate_box').addEventListener('mouseleave', (e)=>{
  e.target.style.display = 'none';
})
document.querySelector('#join_chk').addEventListener('click', (e)=>{
  let box = document.querySelector('#join_chk_box')
  box.style.display = box.style.display == 'none' ? 'flex': 'none'
  box.style.display == 'flex'? box.querySelector("input[name='key']").focus() : null
})
document.querySelector('#join_chk_box').addEventListener('mouseleave', (e)=>{
  e.target.style.display = 'none'
})

let vid_check ; 
let vid_cnt = document.querySelector('#vid_box video')
let vid_box = document.querySelector("#vid_box")
const video_handler = () =>{
  switch(vid_cnt.readyState){
    case 2:
      vid_box.style.display= 'block';
      vid_box.classList.add('zm_class')
      break;
    case 4:
      vid_box.style.display= 'block';
      vid_box.classList.remove('zm_class')
      clearInterval(vid_check)
      break;
  }
}
vid_cnt.addEventListener('mouseenter', (e)=>{e.target.pause()})
vid_cnt.addEventListener('mouseleave', (e)=>{e.target.play()})
vid_check = setInterval(video_handler, 2000)

document.addEventListener("visibilitychange", ()=>{
  if(document.visibilityState == 'visible'){
    vid_cnt.play();
  }else {vid_cnt.pause()}

})

let scrolling = false;

document.addEventListener('scroll', ()=>{ scrolling = true })

const isVisible = ()=>{
  const rect = document.querySelectorAll('body h2')[3].getBoundingClientRect();
  return (
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) ||
    rect.top <= (window.innerHeight || document.documentElement.clientHeight)
  )
}

const vid_handler = () =>{
  if (scrolling){
    scrolling = false;
    if (isVisible()){
      vid_box.style.display = 'block';
      setTimeout(()=> {
      vid_cnt.play();  
      }, 300)
    } else {
      vid_box.style.display = 'none';
      vid_cnt.pause();
    }
  }
}

setInterval(vid_handler, 200);
