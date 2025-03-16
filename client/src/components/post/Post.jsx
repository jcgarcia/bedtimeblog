import './post.css'
import PostBox from '../../media/NewPost.jpg'

export default function Post() {
  return (
    <div className='post'>
        <img 
        className='postImg'
        src={PostBox}
        alt="" 
        />
        <div className='postInfo'>
            <div className='postCats'>
                <span className='postCat'>Life</span>
                <span className='postCat'>Tech</span>

            </div>
            <span className="postTitle">
                This is the title of the post
            </span>
            <hr />
            <span className="postDate">1 hour ago</span>
        </div>

        <p className='postDescription'>Lorem ipsum dolor sit amet consectetur adipisicing elit. Possimus sequi ea nobis quae enim voluptatibus rem voluptas necessitatibus atque totam iste, modi officiis labore, vero dolorum pariatur, repudiandae dolorem doloribus.</p>
   
    </div>
  )
}
