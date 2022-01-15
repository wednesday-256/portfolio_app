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

