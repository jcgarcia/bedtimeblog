import "./singlePost.css";
import PostImg from '../../media/NewPost.jpg';

export default function singlePost() {
  return (
    <div className='singlePost'>
      <div className="singlePostWrapper">
          <img 
            src={PostImg}
            alt="Post" 
            className="singlePostImg" 
            />
            <h1 className="singlePostTitle">
                This is the post title for a single post. 
            <div className="singlePostEdit">
                <i className="SinglePostIcon fa-regular fa-pen-to-square"></i>
                <i className="SinglePostIcon fa-regular fa-trash-can"></i>           
            </div>
            </h1>
            <div className="singlePostInfo">
                <span className='singlePostAuthor'>
                    Author: <b>YoJulito</b>
                </span>
                <span className='singlePostDate'> Some time ago</span>
            </div>
            <p className="singlePostDesc">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                Id optio porro modi eveniet nisi, consequuntur animi, minus
                 cum recusandae accusantium odit impedit repellendus possimus 
                 unde natus quod dignissimos? Reprehenderit, sapiente!
                Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                Id optio porro modi eveniet nisi, consequuntur animi, minus
                 cum recusandae accusantium odit impedit repellendus possimus 
                 unde natus quod dignissimos? Reprehenderit, sapiente!
                Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                Id optio porro modi eveniet nisi, consequuntur animi, minus
                 cum recusandae accusantium odit impedit repellendus possimus 
                 unde natus quod dignissimos? Reprehenderit, sapiente!
                Lorem ipsum dolor sit amet consectetur adipisicing elit. 
                Id optio porro modi eveniet nisi, consequuntur animi, minus
                 cum recusandae accusantium odit impedit repellendus possimus 
                 unde natus quod dignissimos? Reprehenderit, sapiente!

            </p>

      </div>
    </div>
  );
}
