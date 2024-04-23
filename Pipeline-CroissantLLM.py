# Example: reuse your existing OpenAI setup
import gradio as gr
from transformers import AutoTokenizer, AutoModelForCausalLM, StoppingCriteriaList
import time


model_name = "croissantllm/CroissantLLMChat-v0.1"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name)


def stop(inputs_ids, scores):
    is_done = inputs_ids[0, -1] == tokenizer.eos_token_id
    return is_done


def response(message, history):

    chat = [
        {"role": "user", "content": message},
    ]

    chat_input = tokenizer.apply_chat_template(
        chat, tokenize=False, add_generation_prompt=True)

    inputs = tokenizer(chat_input, return_tensors="pt",
                       add_special_tokens=True)
    print('Nombre de tokens en entrée : ', len(tokenizer.encode(chat_input)))

    stopping_criteria = StoppingCriteriaList([stop])

    start_time = time.time()
    tokens = model.generate(**inputs, max_new_tokens=500,
                            do_sample=True, temperature=0.3, top_p=0.9,
                            pad_token_id=tokenizer.eos_token_id,
                            stopping_criteria=stopping_criteria)
    end_time = time.time()
    print('Time taken to generate response:', end_time-start_time, 'secondes')
    res = tokenizer.decode(tokens[0], skip_special_tokens=True)

    res_tokens = tokenizer.encode(res)
    print('Nombre de tokens en sortie : ', len(res_tokens))

    res_index = res.split('\n').index('<|im_start|> assistant')
    cleaned_res = res.split('\n')[res_index+1:]
    response_text = '\n'.join(cleaned_res)

    return response_text


# print(completion.choices[0].message)
gr.ChatInterface(response).launch()
