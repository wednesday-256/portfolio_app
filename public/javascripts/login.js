document.querySelector('#logbtn').addEventListener('click', (e)=>{
  let box  = document.querySelector('#logbox')
  box.style.display = box.style.display != 'flex'? 'flex': 'none'
})
document.querySelector('#logbox').addEventListener('mouseleave', (e)=>{e.target.style.display = 'none'})

document.querySelector('#regbtn').addEventListener('click', (e)=>{
  let box  = document.querySelector('#regbox')
  box.style.display = box.style.display != 'flex'? 'flex': 'none'
})
document.querySelector('#regbox').addEventListener('mouseleave', (e)=>{e.target.style.display = 'none'})

document.querySelector('#recbtn').addEventListener('click', (e)=>{
  let box  = document.querySelector('#recbox')
  box.style.display = box.style.display != 'flex'? 'flex': 'none'
  if (box.style.display == 'flex') {
      document.querySelector('#logbox').style.display = 'none'
  }
})
document.querySelector('#recbox').addEventListener('mouseleave', (e)=>{e.target.style.display = 'none'})
