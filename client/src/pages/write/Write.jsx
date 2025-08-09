import "./write.css";
import PostImg from '../../media/NewPost.jpg';

export default function Write() {
  return (
    <div className="write">
        <img 
        className="writeImg" 
        src={PostImg}
        alt="Post writing" 
        />
     <form className="writeForm">
        <div className="writeFormGroup">
            <label htmlFor="fileInput">
            <i class="writeIcon fa-solid fa-file-arrow-up"></i> 
            </label>
            <input type="file" id="fileInput" style={{display:"none"}}/>
            <input type="text" placeholder="Title" className="writeInput" autoFocus={true}/>
        </div>
        <div className="writeFormGroup">
            <textarea 
            placeholder="Tell the story..." 
            type="text" 
            className="writeInput writeText">               
            </textarea>
        </div>
        <button className="writeSubmit">Publish</button>
     </form>
    </div>
  )
}
